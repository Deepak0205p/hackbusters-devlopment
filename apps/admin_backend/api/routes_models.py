from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import List
from apps.admin_backend.models.manager import model_manager, ModelMetadata, VRAMTelemetry, SwapEvent

router = APIRouter(prefix="/api/models", tags=["Model Management & VRAM Layer"])

class SwapRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: str

class SetEndpointRequest(BaseModel):
    endpoint_url: str

class NodeHealthResponse(BaseModel):
    node_ip: str
    endpoint_url: str
    is_online: bool
    status: str

@router.get("", response_model=List[ModelMetadata])
async def get_model_registry():
    """
    Returns all registered open-weight models, current active VRAM residency,
    quantization levels, and context windows.
    """
    return model_manager.get_models()

@router.get("/vram", response_model=VRAMTelemetry)
async def get_vram_telemetry():
    """
    Returns the real-time VRAM budget allocation breakdown across
    OS, primary reasoning model, active secondary model, and KV cache.
    """
    return model_manager.get_vram_telemetry()

@router.post("/swap", response_model=SwapEvent)
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

@router.post("/{model_id}/endpoint", response_model=ModelMetadata)
async def set_model_endpoint(model_id: str, request: SetEndpointRequest):
    """
    Dynamically assigns a 1-IP node endpoint for a model in the hybrid mesh.
    Example: http://192.168.0.102:11434
    """
    if model_id not in model_manager.models:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")
    
    clean_url = request.endpoint_url.strip().rstrip("/")
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = f"http://{clean_url}"
    if not clean_url.endswith(":11434") and not clean_url.endswith(":8000") and ":" not in clean_url[8:]:
        clean_url = f"{clean_url}:11434"

    # Extract IP
    node_ip = clean_url.split("://")[-1].split(":")[0]

    model_meta = model_manager.models[model_id]
    model_meta.endpoint_url = clean_url
    model_meta.node_ip = node_ip
    return model_meta

@router.get("/{model_id}/health", response_model=NodeHealthResponse)
async def check_node_health(model_id: str):
    """
    Probes whether the assigned laptop/compute node for this model is currently reachable on the LAN.
    """
    if model_id not in model_manager.models:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")
    
    from apps.admin_backend.models.compute_backends import get_backend_for_model
    backend, _ = get_backend_for_model(model_id)
    is_online = backend.is_online()
    meta = model_manager.models[model_id]

    return NodeHealthResponse(
        node_ip=meta.node_ip or "127.0.0.1",
        endpoint_url=meta.endpoint_url or "http://127.0.0.1:11434",
        is_online=is_online,
        status="ONLINE" if is_online else "OFFLINE_FALLBACK_LOCAL"
    )
