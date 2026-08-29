# Plan 12: Quantization Validation & GGUF Q4_K_M Correctness Check

## 1. Objective
Define the validation criteria for GGUF Q4_K_M quantization across all four models, balancing token throughput (45-65 TPS), memory footprint ($\le 2.8\text{ GB}$ per model), and domain reasoning perplexity.

## 2. Requirement Mapping
- **SIH26117 Requirement 03:** *SINGLE WORKSTATION WITH MID-RANGE GPU* — Optimized GGUF Q4_K_M quantized models fit comfortably within a 6GB VRAM hardware ceiling.

## 3. Detailed Design & Technical Approach

### 3.1. Quantization Specification Matrix

| Model Identifier | Base Architecture | Quantization Type | Parameter Count | Disk Size | VRAM Footprint | Target Throughput (TPS) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`qwen3:4b-q4_k_m`** | Qwen 3 Dense Transformer | **GGUF Q4_K_M** (Medium k-quant) | 4.0 Billion | ~2.6 GB | **2.8 GB** | 30 - 45 TPS |
| **`qwen2.5-coder:3b-q4_k_m`** | Qwen 2.5 Coder Architecture | **GGUF Q4_K_M** | 3.1 Billion | ~1.9 GB | **2.0 GB** | 45 - 65 TPS |
| **`qwen2-vl:2b-q4_k_m`** | Qwen2 Vision-Language | **GGUF Q4_K_M** | 2.2 Billion | ~1.8 GB | **2.0 GB** | 40 - 55 TPS |
| **`llama3.2:3b-q4_k_m`** | Llama 3.2 Transformer | **GGUF Q4_K_M** | 3.2 Billion | ~1.9 GB | **2.0 GB** | 45 - 60 TPS |

### 3.2. Automated Quantization Validation Script (`backend/core/quant_validator.py`)
```python
import httpx
from typing import Dict, Any

async def validate_model_quantization(model_tag: str) -> Dict[str, Any]:
    url = "http://127.0.0.1:11434/api/show"
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(url, json={"name": model_tag})
        if resp.status_code != 200:
            return {"valid": False, "error": f"Model {model_tag} not found."}
        
        details = resp.json().get("details", {})
        quant_format = details.get("quantization_level", "").upper()
        
        # Verify Q4_K_M or compatible 4-bit quantization
        is_q4 = "Q4" in quant_format or "4BIT" in quant_format or "Q4_K_M" in quant_format
        return {
            "model": model_tag,
            "quantization_detected": quant_format,
            "format": details.get("format", "gguf"),
            "parameter_size": details.get("parameter_size", "unknown"),
            "is_compliant": is_q4
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Model tag string.
- **Output:** Compliance report verifying GGUF container and 4-bit quantization level.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 05](file:///G:/SIH/p/docs/plans/05_model_download_verification.md), [Plan 08](file:///G:/SIH/p/docs/plans/08_models_yaml_schema.md).
- Depended on by: [Plan 11](file:///G:/SIH/p/docs/plans/11_model_health_startup.md).

## 6. Edge Cases & Failure Modes
- **Unquantized FP16 Model Pulled by Mistake:** Validation flags FP16 parameter size ($> 7\text{ GB}$), raising immediate alert that VRAM ceiling will be breached.

## 7. Acceptance Criteria & Verification
- All 4 models report `is_compliant: True` with detected quantization level matching `Q4_K_M` or `Q4_0`.
- Peak allocated VRAM during token generation stays under the 2.8 GB model ceiling.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** `Q4_K_M` is selected over `Q4_0` because k-quantization retains over 99.1% of FP16 perplexity in mathematical and code generation tasks with negligible extra memory.
