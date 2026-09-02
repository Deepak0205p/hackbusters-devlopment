import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ConfigDict

from apps.shared.models.manager import (
    model_manager,
    ModelMetadata,
    VRAMTelemetry,
    SwapEvent
)
from apps.shared.models.compute_backends import (
    get_backend_for_model,
    backend_registry,
    NormalizedResponse
)

router = APIRouter(tags=["Model Management & Dynamic VRAM Swapper"])

# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================
class SwapRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: str = Field(..., description="Target model ID to load into active VRAM")

class UnloadRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: str = Field(..., description="Model ID to evict from VRAM")

class SetEndpointRequest(BaseModel):
    endpoint_url: str = Field(..., description="LAN endpoint URL (e.g. http://192.168.0.102:11434)")

class GenerateRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    prompt: str = Field(..., description="User prompt or instruction")
    model_id: Optional[str] = Field("qwen3-4b", description="Model ID to execute inference on")
    system_prompt: Optional[str] = Field(None, description="System persona and boundary constraints")
    max_tokens: int = Field(512, ge=1, le=8192)
    temperature: float = Field(0.2, ge=0.0, le=2.0)
    stream: bool = Field(False, description="Whether to stream response tokens")

class NodeHealthResponse(BaseModel):
    node_ip: str
    endpoint_url: str
    is_online: bool
    status: str
    latency_ms: float = 0.0

class ModelStatusResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    active_primary_model: Optional[str]
    active_secondary_model: Optional[str]
    loaded_models: List[str]
    vram_telemetry: VRAMTelemetry
    total_registered_models: int

# ==============================================================================
# 1. MODEL REGISTRY & STATUS ENDPOINTS
# ==============================================================================
@router.get("/api/v1/models", response_model=List[ModelMetadata])
@router.get("/api/models", response_model=List[ModelMetadata])
async def get_model_registry():
    """
    Returns all registered open-weight models, current active VRAM residency,
    quantization levels, and context windows.
    """
    return model_manager.get_models()

@router.get("/api/v1/models/status", response_model=ModelStatusResponse)
@router.get("/api/models/status", response_model=ModelStatusResponse)
async def get_model_status():
    """
    Live status observatory of active models, residency set, and VRAM utilization.
    """
    vram = model_manager.get_vram_telemetry()
    return ModelStatusResponse(
        active_primary_model=model_manager.primary_model_id,
        active_secondary_model=model_manager.active_secondary_model_id,
        loaded_models=list(model_manager.loaded_models),
        vram_telemetry=vram,
        total_registered_models=len(model_manager.models)
    )

@router.get("/api/v1/models/vram", response_model=VRAMTelemetry)
@router.get("/api/models/vram", response_model=VRAMTelemetry)
async def get_vram_telemetry():
    """
    Returns real-time VRAM budget allocation across OS, primary model, secondary model, and headroom.
    """
    return model_manager.get_vram_telemetry()

@router.get("/api/v1/models/swaps", response_model=List[SwapEvent])
@router.get("/api/models/swaps", response_model=List[SwapEvent])
async def get_swap_history():
    """
    Returns real-time LRU model swapping and eviction history logs.
    """
    return model_manager.swap_history

# ==============================================================================
# 2. DYNAMIC MODEL SWAPPING & UNLOAD ENDPOINTS
# ==============================================================================
@router.post("/api/v1/models/swap", response_model=SwapEvent)
@router.post("/api/models/swap", response_model=SwapEvent)
async def swap_model(request: SwapRequest):
    """
    Dynamically evicts the currently loaded secondary model from VRAM and
    loads the requested target model via Ollama keep_alive control (<1.2s target).
    """
    try:
        event = model_manager.swap_secondary_model(request.model_id)
        return event
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/api/v1/models/unload")
@router.post("/api/models/unload")
async def unload_model(request: UnloadRequest):
    """Explicitly unloads a model from active VRAM residency."""
    if request.model_id not in model_manager.models:
        raise HTTPException(status_code=404, detail=f"Model '{request.model_id}' not found.")
    
    success = model_manager.unload_model(request.model_id)
    return {
        "status": "SUCCESS" if success else "FAILED",
        "message": f"Model '{request.model_id}' unloaded from VRAM."
    }

# ==============================================================================
# 3. UNIFIED INFERENCE GENERATION & STREAMING ENDPOINT
# ==============================================================================
@router.post("/api/v1/models/generate")
@router.post("/api/models/generate")
async def generate_completion(req: GenerateRequest):
    """
    Unified local inference endpoint. Automatically ensures model is loaded in VRAM
    via LRU swapper, then executes inference or streaming token delivery.
    """
    model_id = req.model_id or model_manager.primary_model_id
    
    # 1. Ensure target model is loaded in VRAM
    loaded, msg, swap_event = model_manager.ensure_model_loaded(model_id)
    if not loaded:
        raise HTTPException(status_code=400, detail=msg)

    # 2. Resolve compute backend
    backend, meta = get_backend_for_model(model_id)

    # 3. Handle token streaming
    if req.stream:
        async def token_streamer():
            async for token in backend.generate_stream(
                prompt=req.prompt,
                system_prompt=req.system_prompt,
                max_tokens=req.max_tokens,
                temperature=req.temperature,
                model=model_id,
                ollama_tag=meta.get("ollama_tag"),
                vllm_model_name=meta.get("vllm_model_name")
            ):
                yield token

        return StreamingResponse(token_streamer(), media_type="text/plain")

    # 4. Synchronous execution
    response = backend.generate(
        prompt=req.prompt,
        system_prompt=req.system_prompt,
        max_tokens=req.max_tokens,
        temperature=req.temperature,
        model=model_id,
        ollama_tag=meta.get("ollama_tag"),
        vllm_model_name=meta.get("vllm_model_name")
    )

    return {
        "status": "SUCCESS" if response.success else "ERROR",
        "model": response.model,
        "content": response.content,
        "tokens_generated": response.tokens_generated,
        "duration_seconds": response.duration_seconds,
        "tokens_per_second": response.tokens_per_second,
        "backend_type": response.backend_type,
        "error": response.error
    }

# ==============================================================================
# 4. NODE TOPOLOGY & HEALTH PROBING
# ==============================================================================
@router.post("/api/v1/models/{model_id}/endpoint", response_model=ModelMetadata)
@router.post("/api/models/{model_id}/endpoint", response_model=ModelMetadata)
async def set_model_endpoint(model_id: str, request: SetEndpointRequest):
    """Dynamically assigns a LAN node endpoint for a model."""
    if model_id not in model_manager.models:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")
    
    clean_url = request.endpoint_url.strip().rstrip("/")
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = f"http://{clean_url}"
    
    node_ip = clean_url.split("://")[-1].split(":")[0]

    model_meta = model_manager.models[model_id]
    model_meta.endpoint_url = clean_url
    model_meta.node_ip = node_ip
    return model_meta

@router.get("/api/v1/models/{model_id}/health", response_model=NodeHealthResponse)
@router.get("/api/models/{model_id}/health", response_model=NodeHealthResponse)
async def check_node_health(model_id: str):
    """Probes whether the assigned node endpoint is currently online."""
    if model_id not in model_manager.models:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")
    
    backend, meta = get_backend_for_model(model_id)
    t0 = time.time()
    is_online = backend.is_online()
    latency = round((time.time() - t0) * 1000, 2)

    return NodeHealthResponse(
        node_ip=meta.get("node_ip", "127.0.0.1"),
        endpoint_url=meta.get("endpoint_url", "http://127.0.0.1:11434"),
        is_online=is_online,
        status="ONLINE" if is_online else "OFFLINE_FALLBACK_LOCAL",
        latency_ms=latency
    )
