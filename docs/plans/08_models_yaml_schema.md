# Plan 08: models.yaml Schema Design & Hot-Reloadable Registry

## 1. Objective
Design the declarative YAML configuration schema (`models.yaml`) and dynamic file-watcher/loader in FastAPI to enable adding, modifying, and re-parameterizing open-weight models at runtime without backend restarts.

## 2. Requirement Mapping
- **SIH26117 Requirement 05:** *EXTENSIBLE MODEL REGISTRY* — New open-weight models must be easily addable via configuration files without requiring architectural redesign or code refactoring.

## 3. Detailed Design & Technical Approach

### 3.1. YAML Schema Definition (`models.yaml`)
```yaml
version: "1.0.0"
default_primary_model: "qwen3-4b"
default_general_model: "llama-3.2-3b"

models:
  - id: "qwen3-4b"
    name: "Qwen 3 4B"
    role: "Deep Reasoning & Planning Engine"
    quantization: "GGUF Q4_K_M"
    vram_footprint_gb: 2.8
    context_window_tokens: 8192
    serving_provider: "ollama"
    ollama_model_tag: "qwen3:4b-q4_k_m"
    task_types:
      - "reasoning"
      - "planning"
      - "policy_evaluation"
      - "approval_note_drafting"
    temperature: 0.2
    top_p: 0.9
    is_primary: true

  - id: "qwen2.5-coder-3b"
    name: "Qwen 2.5 Coder 3B"
    role: "Code Generation Specialist"
    quantization: "GGUF Q4_K_M"
    vram_footprint_gb: 2.0
    context_window_tokens: 8192
    serving_provider: "ollama"
    ollama_model_tag: "qwen2.5-coder:3b-q4_k_m"
    task_types:
      - "coding"
      - "python_scripting"
      - "engineering_calculation"
    temperature: 0.1
    top_p: 0.95
    is_primary: false

  - id: "qwen2-vl-2b"
    name: "Qwen2-VL 2B"
    role: "Multimodal Vision Specialist"
    quantization: "GGUF Q4_K_M"
    vram_footprint_gb: 2.0
    context_window_tokens: 4096
    serving_provider: "ollama"
    ollama_model_tag: "qwen2-vl:2b-q4_k_m"
    task_types:
      - "vision"
      - "pid_diagram_analysis"
      - "scanned_inspection_pdf"
    temperature: 0.2
    top_p: 0.9
    is_primary: false

  - id: "llama-3.2-3b"
    name: "Llama 3.2 3B"
    role: "General Conversational Assistant"
    quantization: "GGUF Q4_K_M"
    vram_footprint_gb: 2.0
    context_window_tokens: 8192
    serving_provider: "ollama"
    ollama_model_tag: "llama3.2:3b-q4_k_m"
    task_types:
      - "general"
      - "conversational_qa"
    temperature: 0.4
    top_p: 0.9
    is_primary: false
```

### 3.2. Dynamic Registry Loader & Pydantic Validation (`backend/config/model_config.py`)
```python
from pydantic import BaseModel, Field
from typing import List, Optional
import yaml
import os

class ModelEntry(BaseModel):
    id: str
    name: str
    role: str
    quantization: str
    vram_footprint_gb: float
    context_window_tokens: int
    serving_provider: str = "ollama"
    ollama_model_tag: str
    task_types: List[str]
    temperature: float = 0.2
    top_p: float = 0.9
    is_primary: bool = False

class ModelRegistry(BaseModel):
    version: str
    default_primary_model: str
    default_general_model: str
    models: List[ModelEntry]

def load_model_registry(path: str = "models.yaml") -> ModelRegistry:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model registry file {path} not found.")
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return ModelRegistry(**data)
```

## 4. Inputs / Outputs & Contracts
- **Input:** `models.yaml` filesystem file.
- **Output:** Validated `ModelRegistry` Pydantic instance cached in memory with file mtime watcher.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md).
- Depended on by: [Plan 09](file:///G:/SIH/p/docs/plans/09_vram_budget_validation.md), [Plan 10](file:///G:/SIH/p/docs/plans/10_model_swapping_lru.md), [Plan 14](file:///G:/SIH/p/docs/plans/14_router_stage1_regex.md).

## 6. Edge Cases & Failure Modes
- **YAML Syntax Error:** Catch `yaml.YAMLError` during reload, keep previous working registry state in memory, and log error warning.
- **Missing Required Fields:** Pydantic validation catches missing `vram_footprint_gb` or `ollama_model_tag` before activating model.

## 7. Acceptance Criteria & Verification
- Modifying `models.yaml` dynamically updates `/api/models` endpoint output within 1 second without server restart.
- Pydantic rejects invalid configuration schema gracefully.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Hot-reloading is implemented using file modification timestamp (`os.path.getmtime`) comparison on request, avoiding heavy background thread overhead.
