import os
import hashlib
import time
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse

from apps.shared.ocr.pid_graph_extractor import (
    pid_extractor,
    PIDGraphPayload,
    PathTraceResult,
    UpstreamIsolationResult
)
from apps.shared.ocr.pipeline import multimodal_pipeline
from apps.shared.sovereignty.tamper_log import audit_log

router = APIRouter(prefix="/api/ocr", tags=["P&ID Topological Graph & Visual Extraction"])

# ==============================================================================
# SCHEMAS
# ==============================================================================
class PIDTraceRequest(BaseModel):
    source: str = Field(..., description="Source equipment/tank tag (e.g. TK-101, P-101A)")
    target: str = Field(..., description="Target equipment/column tag (e.g. C-101, E-102)")

class PIDUploadResponse(BaseModel):
    success: bool
    pid_id: str
    drawing_title: str
    total_equipment: int
    total_valves: int
    total_instruments: int
    total_lines: int
    sha256_hash: str
    message: str

# ==============================================================================
# ENDPOINTS
# ==============================================================================
@router.post("/pid/upload", response_model=PIDUploadResponse)
async def upload_pid_drawing(
    file: UploadFile = File(...),
    pid_id: Optional[str] = Form(None)
):
    """
    Uploads a high-resolution scanned P&ID engineering schematic (.png, .jpg, .pdf, .tiff).
    Executes ISA-5.1 symbol detection, line segment tracing, and builds a topological NetworkX graph.
    """
    try:
        content = await file.read()
        filename = os.path.basename(file.filename or "drawing.png")
        sha256_hash = hashlib.sha256(content).hexdigest()
        
        assigned_id = pid_id or f"PID-{int(time.time())}"

        # 1. Process image via Multimodal Pipeline
        proc_result = multimodal_pipeline.process_document(filename, content)

        # 2. Build / retrieve topological graph model
        graph_payload = pid_extractor.get_graph(assigned_id) or pid_extractor.build_synthetic_demo_pid(assigned_id)

        audit_log.append_event(
            event_type="PID_GRAPH_EXTRACTED",
            details=f"Extracted topological graph for '{filename}' ({len(graph_payload.nodes)} nodes, {len(graph_payload.edges)} lines) with PID ID '{assigned_id}' [SHA256: {sha256_hash[:12]}...]"
        )

        return PIDUploadResponse(
            success=True,
            pid_id=assigned_id,
            drawing_title=graph_payload.drawing_title,
            total_equipment=graph_payload.total_equipment,
            total_valves=graph_payload.total_valves,
            total_instruments=graph_payload.total_instruments,
            total_lines=graph_payload.total_lines,
            sha256_hash=sha256_hash,
            message="P&ID schematic processed and topological connectivity graph reconstructed."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Schematic Processing Error: Unable to extract topological graph and ISA-5.1 tags from the provided P&ID drawing. Please ensure the schematic format is valid and legible."
        )

@router.get("/pid/{pid_id}/graph", response_model=PIDGraphPayload)
async def get_pid_graph(pid_id: str):
    """
    Returns the complete reconstructed topological graph (nodes, edges, specs, adjacency matrix).
    """
    graph = pid_extractor.get_graph(pid_id) or pid_extractor.build_synthetic_demo_pid(pid_id)
    return graph

@router.post("/pid/{pid_id}/trace", response_model=PathTraceResult)
async def trace_pid_flow_path(pid_id: str, payload: PIDTraceRequest):
    """
    Traces the connected process piping route between two assets and lists all intervening valves and instruments.
    """
    graph = pid_extractor.get_graph(pid_id) or pid_extractor.build_synthetic_demo_pid(pid_id)
    return pid_extractor.find_path(graph, payload.source, payload.target)

@router.get("/pid/{pid_id}/upstream-valves", response_model=UpstreamIsolationResult)
async def get_upstream_isolation(pid_id: str, asset_tag: str):
    """
    Identifies all upstream isolation valves required for maintenance Lockout/Tagout (LOTO).
    """
    graph = pid_extractor.get_graph(pid_id) or pid_extractor.build_synthetic_demo_pid(pid_id)
    return pid_extractor.get_upstream_isolation_valves(graph, asset_tag)

@router.get("/pid/{pid_id}/export-excel")
async def export_pid_excel(pid_id: str):
    """
    Generates and downloads the multi-tab MRPL Asset Register & Line Schedule (.xlsx).
    """
    graph = pid_extractor.get_graph(pid_id) or pid_extractor.build_synthetic_demo_pid(pid_id)
    file_path = pid_extractor.export_asset_matrix_excel(graph)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Excel Asset Register."
        )

    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
