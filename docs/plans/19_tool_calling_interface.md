# Plan 19: Tool-Calling Interface & Abstract BaseTool Design

## 1. Objective
Design the standardized, extensible `BaseTool` class in `backend/tools/base.py` that all local offline tools implement, ensuring consistent parameter validation, error interception, execution metrics, and zero-egress enforcement.

## 2. Requirement Mapping
- **SIH26117 Requirement 06:** *AGENTIC PLANNING & TOOL CALLING* — Standardized execution of local tools (file I/O, sandboxed code execution, document search).

## 3. Detailed Design & Technical Approach

### 3.1. Abstract BaseTool Definition (`backend/tools/base.py`)
```python
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import time
import json
import logging

logger = logging.getLogger("tools")

class BaseTool(ABC):
    name: str
    description: str

    @abstractmethod
    async def _run(self, **kwargs) -> Dict[str, Any]:
        """Core execution logic to be implemented by each tool."""
        pass

    async def execute(self, action_input: str) -> str:
        """Standard wrapper parsing inputs, measuring execution time, and catching exceptions."""
        start_time = time.perf_counter()
        try:
            # Parse input arguments (JSON or raw string)
            args = {}
            if action_input.strip().startswith("{") and action_input.strip().endswith("}"):
                args = json.loads(action_input)
            else:
                args = {"query": action_input.strip()}

            result = await self._run(**args)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            result["tool_latency_ms"] = latency_ms
            return json.dumps(result, ensure_ascii=False)
        except Exception as e:
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"Error in tool '{self.name}': {e}", exc_info=True)
            return json.dumps({
                "status": "ERROR",
                "error_type": type(e).__name__,
                "message": str(e),
                "tool_latency_ms": latency_ms
            })

    def get_description(self) -> str:
        return f"{self.name}: {self.description}"
```

### 3.2. Local Tool Catalog Registry
All tools are registered in a single dictionary for dynamic injection into LangChain:
```python
from backend.tools.docker_sandbox import DockerSandboxTool
from backend.tools.ocr_tool import PaddleOCRTool
from backend.tools.docx_tool import DocxGeneratorTool
from backend.tools.xlsx_tool import XlsxGeneratorTool
from backend.tools.pptx_tool import PptxGeneratorTool
from backend.tools.rag_search_tool import ChromaRAGSearchTool
from backend.tools.audit_tool import SovereigntyAuditTool

TOOL_REGISTRY = {
    "docker_python_sandbox": DockerSandboxTool(),
    "paddle_ocr": PaddleOCRTool(),
    "docx_generator": DocxGeneratorTool(),
    "xlsx_generator": XlsxGeneratorTool(),
    "pptx_generator": PptxGeneratorTool(),
    "chroma_sop_search": ChromaRAGSearchTool(),
    "network_sovereignty_watchdog": SovereigntyAuditTool()
}
```

## 4. Inputs / Outputs & Contracts
- **Input:** Raw `action_input` string from LLM ReAct generation.
- **Output:** Serialized JSON string returned to agent as `Observation`.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 02](file:///G:/SIH/p/docs/plans/02_folder_structure.md).
- Depended on by: [Plan 20](file:///G:/SIH/p/docs/plans/20_self_correction_loop.md), [Plan 24-39](file:///G:/SIH/p/docs/plans/24_paddleocr_integration.md) (All local tool implementations).

## 6. Edge Cases & Failure Modes
- **Malformed JSON in Action Input:** Fallback to passing raw string as `{"query": action_input}`.

## 7. Acceptance Criteria & Verification
- Every tool inherits from `BaseTool` and handles unhandled exceptions without raising uncaught errors.
- Output JSON always includes `status` and `tool_latency_ms`.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Returning structured JSON in `Observation` gives 3B/4B models explicit error types and fields to guide self-correction.
