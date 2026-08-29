# Plan 13: Model Load Failure Fallback & Error Handling Design

## 1. Objective
Design the fault-tolerance and automated recovery subsystem when an active model fails to load, crashes due to temporary GPU contention, or exhausts runtime KV cache buffers.

## 2. Requirement Mapping
- **SIH26117 Requirement 03:** *SIMULTANEOUS MULTI-MODEL SUPPORT* — Robust memory safety and crash prevention.
- **SIH26117 Requirement 07:** *ITERATIVE SELF-CORRECTION LOOP* — Automated recovery from system-level errors.

## 3. Detailed Design & Technical Approach

### 3.1. Error Classification & Recovery Matrix

| Failure Mode | Trigger Condition | Automated Recovery Action | Fallback Target |
| :--- | :--- | :--- | :--- |
| **CUDA Out of Memory (OOM)** | VRAM exceeds 5.8 GB on model load | Unload all secondary models, force garbage collection, retry load | Primary `qwen3-4b` |
| **Model Weight Missing** | Ollama returns 404 Model Not Found | Log missing tag, route query to general assistant | `llama3.2-3b` |
| **Context Length Overflow** | Input tokens exceed 8192 context limit | Truncate conversation history, summarize earlier turns | Active model with trimmed context |
| **Ollama Service Crash** | Connection reset / connection refused | Wait 1.0s, retry 3 times with exponential backoff, alert UI | Degraded error response with restart guidance |

### 3.2. Resilient Model Dispatch Wrapper (`backend/core/resilient_dispatch.py`)
```python
import logging
from typing import AsyncGenerator
from backend.core.model_manager import ModelSwappingManager
from backend.core.ollama_client import OllamaClient

logger = logging.getLogger("model_dispatch")

class ResilientModelDispatcher:
    def __init__(self, manager: ModelSwappingManager, ollama: OllamaClient):
        self.manager = manager
        self.ollama = ollama

    async def dispatch_with_fallback(
        self,
        target_model_id: str,
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        # Attempt 1: Load target model
        try:
            await self.manager.ensure_model_loaded(target_model_id)
            async for token in self.ollama.generate_stream(
                model=target_model_id,
                prompt=prompt,
                system_prompt=system_prompt
            ):
                yield token
            return
        except Exception as e:
            logger.error(f"Failed to execute on model '{target_model_id}': {e}. Attempting fallback.")

        # Fallback: Evict everything and load default primary reasoning model
        try:
            logger.info("Executing emergency VRAM flush and fallback to primary model.")
            for loaded_id in list(self.manager.active_gpu_pool.keys()):
                await self.ollama.unload_model(loaded_id)
            self.manager.active_gpu_pool.clear()

            fallback_id = "qwen3-4b"
            await self.manager.ensure_model_loaded(fallback_id)
            yield f"[SYSTEM NOTICE: Switched to fallback model {fallback_id} due to memory or engine failure]\n\n"
            async for token in self.ollama.generate_stream(
                model=fallback_id,
                prompt=prompt,
                system_prompt=system_prompt
            ):
                yield token
        except Exception as critical_e:
            yield f"[CRITICAL ERROR: Failed to recover from model execution failure: {critical_e}]"
```

## 4. Inputs / Outputs & Contracts
- **Input:** Target model ID, user prompt, system prompt.
- **Output:** Resilient streaming token generator with automatic fallback fallback interception.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 07](file:///G:/SIH/p/docs/plans/07_ollama_integration.md), [Plan 10](file:///G:/SIH/p/docs/plans/10_model_swapping_lru.md).
- Depended on by: [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md), [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).

## 6. Edge Cases & Failure Modes
- **Simultaneous Failure of Fallback Model:** Intercept double failure and output user-friendly diagnostic alert in the UI chat viewport.

## 7. Acceptance Criteria & Verification
- Simulating a mock 500 error on `qwen2.5-coder-3b` cleanly flushes active pool and completes response via `qwen3-4b`.
- Server process does not terminate or raise unhandled exceptions.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Complete VRAM pool flush on OOM guarantees recovery without leaving fragmented memory buffers in CUDA runtime.
