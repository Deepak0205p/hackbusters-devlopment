# Plan 10: Model Swapping & Dynamic LRU Eviction Algorithm Design

## 1. Objective
Design the dynamic Least Recently Used (LRU) model swapping manager in FastAPI, managing an active GPU pool of maximum 2 models simultaneously and ensuring sub-1.2 second transition latency when task domains switch.

## 2. Requirement Mapping
- **SIH26117 Requirement 03:** *SIMULTANEOUS MULTI-MODEL SUPPORT* — Dynamic VRAM swapping and sub-second model transitions without OOM crashes.

## 3. Detailed Design & Technical Approach

### 3.1. LRU Paging State Machine & Logic (`backend/core/model_manager.py`)
```python
import time
import asyncio
from typing import Dict, List, Optional
from backend.config.model_config import ModelRegistry, ModelEntry, load_model_registry
from backend.core.ollama_client import OllamaClient
from backend.core.vram_monitor import VRAMMonitor

class ModelSwappingManager:
    def __init__(self, registry_path: str = "models.yaml", ollama_client: Optional[OllamaClient] = None):
        self.registry_path = registry_path
        self.ollama = ollama_client or OllamaClient()
        self.vram_monitor = VRAMMonitor()
        self.active_gpu_pool: Dict[str, float] = {}  # model_id -> last_used_timestamp
        self.max_concurrent_models = 2
        self.vram_ceiling_gb = 5.2

    async def ensure_model_loaded(self, target_model_id: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        registry = load_model_registry(self.registry_path)
        model_entry = next((m for m in registry.models if m.id == target_model_id), None)
        if not model_entry:
            raise ValueError(f"Model ID '{target_model_id}' not found in registry.")

        # If already loaded in active GPU pool, touch timestamp and return
        if target_model_id in self.active_gpu_pool:
            self.active_gpu_pool[target_model_id] = time.time()
            return {
                "status": "ALREADY_LOADED",
                "model_id": target_model_id,
                "swap_latency_seconds": round(time.perf_counter() - start_time, 3),
                "active_pool": list(self.active_gpu_pool.keys())
            }

        # Check if we need to evict an active model
        unloaded_model_id = None
        if len(self.active_gpu_pool) >= self.max_concurrent_models:
            # Pick LRU model (prefer evicting non-primary models first)
            lru_candidates = sorted(self.active_gpu_pool.items(), key=lambda x: x[1])
            # If candidate is primary model but another non-primary exists, evict non-primary
            evict_id = lru_candidates[0][0]
            if evict_id == registry.default_primary_model and len(lru_candidates) > 1:
                evict_id = lru_candidates[1][0]
            
            evict_entry = next(m for m in registry.models if m.id == evict_id)
            await self.ollama.unload_model(evict_entry.ollama_model_tag)
            del self.active_gpu_pool[evict_id]
            unloaded_model_id = evict_id

        # Warm up & load target model
        # Send lightweight probe with keep_alive: 5m to pull weights into VRAM
        async for _ in self.ollama.generate_stream(
            model=model_entry.ollama_model_tag,
            prompt="hi",
            keep_alive="5m"
        ):
            break

        self.active_gpu_pool[target_model_id] = time.time()
        latency = round(time.perf_counter() - start_time, 3)

        return {
            "status": "SWAPPED",
            "loaded_model": target_model_id,
            "unloaded_model": unloaded_model_id,
            "swap_latency_seconds": latency,
            "active_pool": list(self.active_gpu_pool.keys())
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Target model ID string (e.g. `"qwen2.5-coder-3b"`).
- **Output:** Swap status payload with `swap_latency_seconds` and active model pool array.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 07](file:///G:/SIH/p/docs/plans/07_ollama_integration.md), [Plan 08](file:///G:/SIH/p/docs/plans/08_models_yaml_schema.md), [Plan 09](file:///G:/SIH/p/docs/plans/09_vram_budget_validation.md).
- Depended on by: [Plan 14](file:///G:/SIH/p/docs/plans/14_router_stage1_regex.md), [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md), [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).

## 6. Edge Cases & Failure Modes
- **Rapid Alternating Task Thrashing:** If user alternates between vision and coding every second, keep both in active pool (max 2) so swapping is 0ms until a 3rd distinct model is requested.
- **Ollama Hanging During Unload:** Set 2.0 second timeout on unload call; proceed with load if timeout expires.

## 7. Acceptance Criteria & Verification
- Unit test verifies sequential swapping: Reasoning $\rightarrow$ Coding $\rightarrow$ Vision maintains $\le 2$ models loaded.
- Transition latency measured across 10 sequential swaps averages $< 1.2\text{ seconds}$.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Primary reasoning model (`qwen3-4b`) is given eviction priority protection so it stays cached in VRAM as long as possible.
