# Plan 07: Ollama Integration Layer & HTTP Client Design

## 1. Objective
Design the asynchronous HTTP integration layer between the FastAPI backend and the local Ollama daemon (`http://127.0.0.1:11434`), supporting streaming token generation, keep-alive control, and explicit parameter injection.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED & AIR-GAPPED* — Localhost HTTP model communication.
- **SIH26117 Requirement 03:** *SIMULTANEOUS MULTI-MODEL SUPPORT* — Concurrent multi-model orchestration via Ollama.

## 3. Detailed Design & Technical Approach

### 3.1. Asynchronous Ollama Client (`backend/core/ollama_client.py`)
```python
import httpx
import json
from typing import AsyncGenerator, Dict, Any, Optional

class OllamaClient:
    def __init__(self, base_url: str = "http://127.0.0.1:11434", timeout_seconds: float = 60.0):
        self.base_url = base_url
        self.timeout = httpx.Timeout(timeout_seconds, connect=5.0)

    async def generate_stream(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        top_p: float = 0.9,
        keep_alive: str = "5m",
        images: Optional[list[str]] = None
    ) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True,
            "keep_alive": keep_alive,
            "options": {
                "temperature": temperature,
                "top_p": top_p
            }
        }
        if system_prompt:
            payload["system"] = system_prompt
        if images:
            payload["images"] = images

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        chunk = json.loads(line)
                        yield chunk.get("response", "")
                        if chunk.get("done", False):
                            break

    async def unload_model(self, model: str) -> bool:
        """Unload model from GPU memory immediately by setting keep_alive to 0."""
        url = f"{self.base_url}/api/generate"
        payload = {"model": model, "keep_alive": 0}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            return resp.status_code == 200
```

## 4. Inputs / Outputs & Contracts
- **Input:** Model tag, prompt, optional system instruction, image base64 strings.
- **Output:** Streaming string generator yielding incremental response tokens.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 05](file:///G:/SIH/p/docs/plans/05_model_download_verification.md).
- Depended on by: [Plan 10](file:///G:/SIH/p/docs/plans/10_model_swapping_lru.md), [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md).

## 6. Edge Cases & Failure Modes
- **Connection Timeout / Ollama Hang:** Catch `httpx.TimeoutException` and yield clean diagnostic error event to UI.
- **Malformed Image Payloads in Qwen2-VL:** Validate base64 image strings before issuing request to Ollama.

## 7. Acceptance Criteria & Verification
- Unit test queries Ollama with test prompt `"echo hello"` and receives streaming response chunks successfully.
- `unload_model()` returns HTTP 200 and frees model VRAM in under 500ms.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** `httpx.AsyncClient` streaming is used natively rather than external heavyweight wrapper SDKs to ensure zero overhead and granular keep-alive control.
