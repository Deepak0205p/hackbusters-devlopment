# Plan 22: Agent Trace Logging & UI Step Event Streaming Design

## 1. Objective
Design the granular event tracing pipeline in `backend/agent/trace_logger.py` that captures each atomic step of the agent's multi-step execution (Routing, Thought, Tool Start, Observation, Self-Correction, Deliverable Ready, Final Answer) and streams it via WebSockets to the Next.js frontend.

## 2. Requirement Mapping
- **SIH26117 Requirement 06:** *AGENTIC PLANNING & TOOL CALLING* — Visual trace of multi-step agent reasoning, tool execution, and self-correction in UI.

## 3. Detailed Design & Technical Approach

### 3.1. Atomic Event Schema Specification

```json
// 1. Task Routing Event
{
  "event": "routing",
  "task_id": "task_10492",
  "domain": "coding",
  "selected_model": "qwen2.5-coder-3b",
  "stage": "stage1_regex",
  "confidence": 0.95
}

// 2. Agent Thought Event
{
  "event": "thought",
  "step": 1,
  "content": "I will calculate the pump hydraulic efficiency using the standard formula and run it in the Docker sandbox."
}

// 3. Tool Invocation Event
{
  "event": "tool_start",
  "step": 1,
  "tool_name": "docker_python_sandbox",
  "input_snippet": "def pump_efficiency(q, h, rho, p): ..."
}

// 4. Tool Observation Event
{
  "event": "tool_end",
  "step": 1,
  "tool_name": "docker_python_sandbox",
  "status": "SUCCESS",
  "output_snippet": "Hydraulic Power: 26.04 kW, Efficiency: 74.4%",
  "latency_ms": 420.5
}

// 5. Self-Correction Trigger Event (if error occurs)
{
  "event": "self_correction",
  "step": 2,
  "attempt": 1,
  "max_attempts": 10,
  "error_type": "ZeroDivisionError",
  "correction_strategy": "Fixing division by zero in denominator."
}

// 6. Deliverable Ready Event
{
  "event": "deliverable_ready",
  "file_type": "docx",
  "filename": "approval_note.docx",
  "download_url": "/api/files/download/approval_note.docx",
  "size_bytes": 34812
}

// 7. Final Answer Event
{
  "event": "final_answer",
  "content": "The calculation has been verified against MRPL SOP-MRPL-PUMP-04...",
  "total_steps": 2,
  "execution_time_seconds": 4.12
}
```

### 3.2. Trace Broadcaster (`backend/agent/trace_logger.py`)
```python
import json
import time
from typing import Dict, Any, Callable, Optional

class TraceLogger:
    def __init__(self, websocket_broadcast: Optional[Callable[[str], Any]] = None):
        self.broadcast = websocket_broadcast
        self.steps: List[Dict[str, Any]] = []

    async def log_event(self, event_type: str, data: Dict[str, Any]):
        payload = {
            "event": event_type,
            "timestamp": time.time(),
            **data
        }
        self.steps.append(payload)
        if self.broadcast:
            await self.broadcast(json.dumps(payload))

    def get_full_trace(self) -> List[Dict[str, Any]]:
        return self.steps
```

## 4. Inputs / Outputs & Contracts
- **Input:** Step progression events during agent loop execution.
- **Output:** Serialized JSON event messages dispatched to active WebSocket clients.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md), [Plan 19](file:///G:/SIH/p/docs/plans/19_tool_calling_interface.md).
- Depended on by: [Plan 44](file:///G:/SIH/p/docs/plans/44_websocket_streaming.md), [Plan 47](file:///G:/SIH/p/docs/plans/47_ui_components.md).

## 6. Edge Cases & Failure Modes
- **WebSocket Disconnection:** Trace events continue appending to in-memory `steps` array so final HTTP response payload contains full trace even if client drops socket.

## 7. Acceptance Criteria & Verification
- WebSocket client receives events in exact chronological sequence.
- UI renders Thought $\rightarrow$ Action $\rightarrow$ Observation accordion cards without layout flicker.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Granular events (`tool_start` before execution and `tool_end` after) ensure the user sees real-time progress during long-running 10-second Docker scripts.
