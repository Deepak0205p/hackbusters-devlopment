from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status

from apps.shared.sandbox.manager import sandbox_manager, SandboxExecutionResult
from apps.shared.sandbox.ast_screener import ast_screener, ASTScreenResult

router = APIRouter(prefix="/api/sandbox", tags=["Container Sandbox & AST Execution"])

# ==============================================================================
# SCHEMAS
# ==============================================================================
class SandboxExecuteRequest(BaseModel):
    code: str = Field(..., description="Python source code to execute inside isolated sandbox.")
    timeout_seconds: Optional[float] = Field(default=10.0, description="Execution timeout limit in seconds.")

class ASTScreenRequest(BaseModel):
    code: str = Field(..., description="Python source code for static AST pre-screening.")

class SandboxStatusResponse(BaseModel):
    status: str
    docker_available: bool
    image_present: bool
    image_name: str
    isolation_mode: str
    active_backend: str
    resource_limits: Dict[str, str]
    network_isolation: str
    memory_limit: str
    cpu_quota: float
    timeout_seconds: float
    ast_screener_rules: int
    air_gap_compliant: bool

# ==============================================================================
# ENDPOINTS
# ==============================================================================
@router.post("/execute", response_model=SandboxExecutionResult)
async def execute_code(payload: SandboxExecuteRequest):
    """
    Executes Python engineering code within an air-gapped Docker container or isolated subprocess.
    Performs static AST pre-screening and logs cryptographic SHA-256 audit events.
    """
    if not payload.code or not payload.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source code parameter 'code' must not be empty."
        )

    result = sandbox_manager.execute_script(
        script_code=payload.code,
        timeout_seconds=payload.timeout_seconds
    )
    return result

@router.post("/screen", response_model=ASTScreenResult)
async def screen_code(payload: ASTScreenRequest):
    """
    Performs dry-run AST static security screening without executing the code.
    Detects forbidden system/socket modules, dunder attribute escapes, and resource bombs.
    """
    if not payload.code or not payload.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source code parameter 'code' must not be empty."
        )

    return ast_screener.screen(payload.code)

@router.get("/status", response_model=SandboxStatusResponse)
async def get_sandbox_status():
    """
    Returns live sandbox availability, isolation parameters, and container runtime health.
    """
    return sandbox_manager.get_status()
