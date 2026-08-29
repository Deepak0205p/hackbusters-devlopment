# Plan 11: Model Health-Check & Startup Verification Plan

## 1. Objective
Design the startup lifecycle health verification probe that executes during FastAPI server initialization, verifying Ollama daemon availability, model inventory readiness, CUDA connectivity, and inference latency benchmarks.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED PLATFORM ON OWN GPU SERVER* — Verified on-premise operational health at boot.
- **SIH26117 Requirement 03:** *SIMULTANEOUS MULTI-MODEL SUPPORT* — Multi-model inventory probe.

## 3. Detailed Design & Technical Approach

### 3.1. FastAPI Lifespan Startup Probe (`backend/core/startup_check.py`)
```python
import logging
from backend.core.ollama_client import OllamaClient
from backend.config.model_config import load_model_registry
from backend.core.vram_monitor import VRAMMonitor

logger = logging.getLogger("startup_health")

async def run_startup_health_check() -> Dict[str, Any]:
    report = {
        "status": "HEALTHY",
        "checks": {},
        "warnings": []
    }
    
    # 1. Check VRAM Monitor
    vram_mon = VRAMMonitor()
    vram_status = vram_mon.get_vram_status()
    report["checks"]["vram"] = vram_status
    if vram_status.get("available") and vram_status.get("total_mb", 0) < 5500:
        report["warnings"].append("Host GPU has less than 6.0GB VRAM.")

    # 2. Check Ollama API Connectivity
    client = OllamaClient()
    registry = load_model_registry("models.yaml")
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as http:
            resp = await http.get("http://127.0.0.1:11434/api/tags")
            if resp.status_code == 200:
                available_models = [m["name"] for m in resp.json().get("models", [])]
                report["checks"]["ollama_online"] = True
                report["checks"]["available_models"] = available_models
                
                # Check for each registered model
                for m in registry.models:
                    present = any(m.ollama_model_tag in name for name in available_models)
                    if not present:
                        report["warnings"].append(f"Model tag '{m.ollama_model_tag}' not yet pulled into Ollama.")
            else:
                report["status"] = "DEGRADED"
                report["checks"]["ollama_online"] = False
    except Exception as e:
        report["status"] = "UNHEALTHY"
        report["checks"]["ollama_online"] = False
        report["warnings"].append(f"Cannot connect to Ollama daemon: {e}")

    return report
```

## 4. Inputs / Outputs & Contracts
- **Input:** Invoked during `@asynccontextmanager` lifespan in `backend/main.py`.
- **Output:** Health summary dictionary logged to console and surfaced via `GET /api/models`.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 07](file:///G:/SIH/p/docs/plans/07_ollama_integration.md), [Plan 08](file:///G:/SIH/p/docs/plans/08_models_yaml_schema.md), [Plan 09](file:///G:/SIH/p/docs/plans/09_vram_budget_validation.md).
- Depended on by: [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).

## 6. Edge Cases & Failure Modes
- **Ollama Offline at Boot:** Backend boots into degraded mode and emits diagnostic alert in UI rather than crashing immediately.
- **Missing Model Tag:** UI shows yellow badge indicating missing model with exact CLI pull instruction.

## 7. Acceptance Criteria & Verification
- Server startup logs show detailed health checklist output within 1.5 seconds of boot.
- `/api/models` endpoint accurately reflects live health status.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Non-blocking health checks ensure FastAPI server stays responsive even if Ollama is currently starting up or pulling a new model.
