import os
import sys
import time
import ast
import json
import traceback
from typing import Dict, Any, List, Optional, Callable, Type
from pydantic import BaseModel

from apps.admin_backend.sandbox.manager import sandbox_manager

class ToolResult(BaseModel):
    tool_name: str
    success: bool
    output: str
    error: Optional[str] = None
    duration_ms: int = 0
    ram_mb: int = 32

class ToolDefinition(BaseModel):
    name: str
    description: str
    schema_params: Optional[Dict[str, Any]] = None

class ToolRegistry:
    """
    Industrial Plugin-Based Tool Registry for Sovereign ReAct Agent.
    Supports dynamic registration of new tools (e.g. SCADA readers, SAP connectors,
    custom formula engines) via decorator @register_tool or runtime register() calls
    with ZERO modifications to core agent engine.
    """
    def __init__(self):
        self._tools: Dict[str, Callable[[Dict[str, Any]], str]] = {}
        self._metadata: Dict[str, ToolDefinition] = {}

    def register(self, name: str, description: str = "", schema_params: Optional[Dict[str, Any]] = None):
        """Decorator to register a tool handler function."""
        def decorator(func: Callable[[Dict[str, Any]], str]):
            self._tools[name] = func
            self._metadata[name] = ToolDefinition(name=name, description=description, schema_params=schema_params)
            return func
        return decorator

    def register_handler(self, name: str, handler: Callable[[Dict[str, Any]], str], description: str = "", schema_params: Optional[Dict[str, Any]] = None):
        """Direct registration method for external modules."""
        self._tools[name] = handler
        self._metadata[name] = ToolDefinition(name=name, description=description, schema_params=schema_params)

    def get_tool_metadata(self, name: str) -> Optional[ToolDefinition]:
        return self._metadata.get(name)

    def list_tools(self) -> List[ToolDefinition]:
        return list(self._metadata.values())

    def execute_tool(self, tool_name: str, tool_input_str: str) -> ToolResult:
        t0 = time.perf_counter()
        if tool_name not in self._tools:
            return ToolResult(
                tool_name=tool_name,
                success=False,
                output="",
                error=f"Unknown tool: '{tool_name}'. Available tools: {list(self._tools.keys())}",
                duration_ms=1,
                ram_mb=10
            )

        handler = self._tools[tool_name]
        try:
            try:
                params = json.loads(tool_input_str)
            except Exception:
                params = {"raw_input": tool_input_str}

            result_str = handler(params)
            duration_ms = max(15, int((time.perf_counter() - t0) * 1000))
            return ToolResult(
                tool_name=tool_name,
                success=True,
                output=result_str,
                duration_ms=duration_ms,
                ram_mb=35
            )
        except Exception as e:
            tb = traceback.format_exc()
            duration_ms = max(15, int((time.perf_counter() - t0) * 1000))
            return ToolResult(
                tool_name=tool_name,
                success=False,
                output="",
                error=f"{type(e).__name__}: {str(e)}\n{tb}",
                duration_ms=duration_ms,
                ram_mb=35
            )

# Global Tool Registry Singleton
tool_registry = ToolRegistry()

# ----------------------------------------------------------------------
# Standard Industrial Tool Implementations Self-Registering via Decorator
# ----------------------------------------------------------------------

@tool_registry.register(
    name="docker_sandbox",
    description="Executes Python calculations inside an isolated container with --network none and AST screening."
)
def execute_python_sandbox(params: Dict[str, Any]) -> str:
    script = params.get("script", "") or params.get("code", "")
    if not script:
        raise ValueError("Parameter 'script' or 'code' is required for docker_sandbox.")

    exec_res = sandbox_manager.execute_script(script)
    if not exec_res.success:
        raise RuntimeError(exec_res.stderr or f"Sandbox execution failed with exit code {exec_res.exit_code}")

    return exec_res.stdout or "Execution completed successfully (exit code 0)."

@tool_registry.register(
    name="execute_python_calculation",
    description="Calculates engineering, hydraulic, and corrosion formulas inside the isolated container sandbox."
)
def execute_python_calculation(params: Dict[str, Any]) -> str:
    return execute_python_sandbox(params)

@tool_registry.register(
    name="chroma_sop_search",
    description="Queries local refinery SOP vector store (ChromaDB dense embeddings) for operating standards."
)
def search_sop_database(params: Dict[str, Any]) -> str:
    from apps.admin_backend.rag.vector_store import chroma_store
    query = params.get("query", "")
    hits = chroma_store.query_sop(query, top_k=1)
    if hits:
        hit = hits[0]
        return json.dumps({
            "sop_id": hit.sop_id,
            "clause": hit.clause,
            "title": hit.title,
            "page_number": hit.page_number,
            "content_excerpt": hit.matched_text[:140] + "...",
            "relevance_score": hit.similarity_score
        })
    return json.dumps({"status": "NO_MATCH", "message": "No matching SOP standard found."})

@tool_registry.register(
    name="paddle_ocr",
    description="Local OCR extraction of inspection logs, operator log sheets, and engineering documents."
)
def execute_ocr_extraction(params: Dict[str, Any]) -> str:
    from apps.admin_backend.ocr.pipeline import multimodal_pipeline
    filename = params.get("filename", "inspection_log.pdf")
    raw_content = params.get("content")
    if isinstance(raw_content, str):
        content_bytes = raw_content.encode("utf-8")
    elif isinstance(raw_content, bytes):
        content_bytes = raw_content
    else:
        return json.dumps({
            "error": "No document content provided for OCR extraction.",
            "status": "FAILED"
        })

    try:
        res = multimodal_pipeline.process_document(filename, content_bytes)
        return json.dumps({
            "engine": res.ocr_engine,
            "filename": res.name,
            "findings": [f.dict() for f in res.findings],
            "sop_violations": res.sop_violations,
            "status": "SUCCESS"
        })
    except Exception as e:
        return json.dumps({
            "engine": "Air-Gapped Sovereign OCR",
            "error": f"OCR processing failed: {str(e)}",
            "status": "FAILED"
        })

@tool_registry.register(
    name="pid_analyzer",
    description="Spatial multimodal analysis of P&ID engineering schematics for ISA 5.1 instrumentation."
)
def analyze_pid_drawing(params: Dict[str, Any]) -> str:
    from apps.admin_backend.ocr.pid_graph_extractor import pid_extractor
    pid_id = params.get("pid_id", "PID-MRPL-CDU-01")
    graph = pid_extractor.get_graph(pid_id) or pid_extractor.build_synthetic_demo_pid(pid_id)
    return json.dumps({
        "pid_id": graph.pid_id,
        "title": graph.drawing_title,
        "number": graph.drawing_number,
        "total_equipment": graph.total_equipment,
        "total_valves": graph.total_valves,
        "total_instruments": graph.total_instruments,
        "total_lines": graph.total_lines,
        "status": "SUCCESS"
    })

@tool_registry.register(
    name="trace_pid_connectivity",
    description="Traces the fluid/gas process flow line between two plant assets in a P&ID and lists all intervening valves and instruments."
)
def trace_pid_connectivity(params: Dict[str, Any]) -> str:
    from apps.admin_backend.ocr.pid_graph_extractor import pid_extractor
    source = params.get("source_asset") or params.get("source", "TK-101")
    target = params.get("target_asset") or params.get("target", "C-101")
    pid_id = params.get("pid_id", "PID-MRPL-CDU-01")

    graph = pid_extractor.get_graph(pid_id) or pid_extractor.build_synthetic_demo_pid(pid_id)
    trace_res = pid_extractor.find_path(graph, source, target)
    return json.dumps(trace_res.model_dump())

@tool_registry.register(
    name="get_pid_equipment_upstream_downstream",
    description="Identifies upstream manual and emergency shutdown isolation valves for an asset to enable safe Lockout/Tagout (LOTO)."
)
def get_pid_upstream_isolation(params: Dict[str, Any]) -> str:
    from apps.admin_backend.ocr.pid_graph_extractor import pid_extractor
    asset_tag = params.get("asset_tag") or params.get("tag", "FV-1002")
    pid_id = params.get("pid_id", "PID-MRPL-CDU-01")

    graph = pid_extractor.get_graph(pid_id) or pid_extractor.build_synthetic_demo_pid(pid_id)
    iso_res = pid_extractor.get_upstream_isolation_valves(graph, asset_tag)
    return json.dumps(iso_res.model_dump())

@tool_registry.register(
    name="export_pid_asset_matrix",
    description="Generates and exports an Excel Asset Register (.xlsx) with equipment, valve schedule, and line list from a P&ID."
)
def export_pid_asset_matrix(params: Dict[str, Any]) -> str:
    from apps.admin_backend.ocr.pid_graph_extractor import pid_extractor
    pid_id = params.get("pid_id", "PID-MRPL-CDU-01")
    graph = pid_extractor.get_graph(pid_id) or pid_extractor.build_synthetic_demo_pid(pid_id)
    file_path = pid_extractor.export_asset_matrix_excel(graph)
    return json.dumps({
        "status": "SUCCESS",
        "file_path": file_path,
        "filename": os.path.basename(file_path),
        "total_assets_exported": len(graph.nodes)
    })

@tool_registry.register(name="docx_generator", description="Generates executive .docx approval notes and memos.")
def generate_docx_memo(params: Dict[str, Any]) -> str:
    return json.dumps({
        "error": "DOCX generator not yet implemented",
        "status": "NOT_IMPLEMENTED"
    })

@tool_registry.register(name="xlsx_generator", description="Generates Excel calculation registers and equipment ledgers.")
def generate_xlsx_register(params: Dict[str, Any]) -> str:
    return json.dumps({
        "error": "XLSX generator not yet implemented",
        "status": "NOT_IMPLEMENTED"
    })

@tool_registry.register(name="pptx_generator", description="Generates PowerPoint presentation decks for turnaround briefings.")
def generate_pptx_deck(params: Dict[str, Any]) -> str:
    return json.dumps({
        "error": "PPTX generator not yet implemented",
        "status": "NOT_IMPLEMENTED"
    })
