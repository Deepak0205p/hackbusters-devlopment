# Plan 05: Local Model Download & Verification Plan

## 1. Objective
Establish the automated verification and pulling protocol for the 4 quantized open-weight GGUF models in Ollama, validating file integrity, GGUF Q4_K_M quantization metadata, and VRAM sizing before runtime initialization.

## 2. Requirement Mapping
- **SIH26117 Requirement 03:** *SIMULTANEOUS MULTI-MODEL SUPPORT* — Local storage and VRAM management for specialized models.
- **SIH26117 Requirement 05:** *EXTENSIBLE MODEL REGISTRY* — Standardized model tags and parameters.

## 3. Detailed Design & Technical Approach

### 3.1. Target Model Inventory & Pull Commands
The local Ollama instance (`127.0.0.1:11434`) must host the exact 4 models:
1. **Qwen 3 4B (Reasoning):** `ollama pull qwen3:4b-q4_k_m` (Est. file size: ~2.6 GB)
2. **Qwen 2.5 Coder 3B (Coding):** `ollama pull qwen2.5-coder:3b-q4_k_m` (Est. file size: ~1.9 GB)
3. **Qwen2-VL 2B (Vision):** `ollama pull qwen2-vl:2b-q4_k_m` (Est. file size: ~1.8 GB)
4. **Llama 3.2 3B (General):** `ollama pull llama3.2:3b-q4_k_m` (Est. file size: ~1.9 GB)

### 3.2. Automated Preflight Health Verification Script
```python
import httpx
import sys

OLLAMA_URL = "http://127.0.0.1:11434/api/tags"
REQUIRED_MODELS = [
    "qwen3:4b-q4_k_m",
    "qwen2.5-coder:3b-q4_k_m",
    "qwen2-vl:2b-q4_k_m",
    "llama3.2:3b-q4_k_m"
]

def verify_models():
    try:
        response = httpx.get(OLLAMA_URL, timeout=5.0)
        response.raise_for_status()
        installed_models = [m["name"] for m in response.json().get("models", [])]
        print(f"Discovered {len(installed_models)} local models in Ollama: {installed_models}")
        
        missing = []
        for req in REQUIRED_MODELS:
            # Check base match
            if not any(req in m for m in installed_models):
                missing.append(req)
        
        if missing:
            print(f"CRITICAL WARNING: Missing models in Ollama: {missing}", file=sys.stderr)
            print("Run 'ollama pull <model_tag>' for each missing model before running full agent workflows.")
            return False
        print("SUCCESS: All 4 mandatory models verified in local Ollama storage.")
        return True
    except Exception as e:
        print(f"ERROR connecting to Ollama at {OLLAMA_URL}: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    verify_models()
```

## 4. Inputs / Outputs & Contracts
- **Input:** Local Ollama daemon running on port 11434.
- **Output:** Verified local GGUF model blobs in Ollama store (`~/.ollama/models`).

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 01](file:///G:/SIH/p/docs/plans/01_environment_setup.md), [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md).
- Depended on by: [Plan 07](file:///G:/SIH/p/docs/plans/07_ollama_integration.md), [Plan 09](file:///G:/SIH/p/docs/plans/09_vram_budget_validation.md), [Plan 10](file:///G:/SIH/p/docs/plans/10_model_swapping_lru.md).

## 6. Edge Cases & Failure Modes
- **Ollama Service Not Running:** Preflight script catches `httpx.ConnectError` and instructs user to launch `ollama serve`.
- **Model Tag Aliases:** If tags in Ollama are named `qwen2.5-coder:3b` without explicit `q4_k_m` suffix, allow alias mapping in `models.yaml`.

## 7. Acceptance Criteria & Verification
- `GET http://127.0.0.1:11434/api/tags` returns HTTP 200 with all 4 model tags present.
- Each model responds to a test prompt via `POST /api/generate` with latency $< 800\text{ ms}$.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Standardizing model tags in `models.yaml` with explicit alias fallbacks prevents startup failures if the local developer pulled models with default tags.
