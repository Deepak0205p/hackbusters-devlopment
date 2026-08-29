# Plan 23: Timeout & Circuit Breaker Design for Agent Loops

## 1. Objective
Design execution deadlines, recursion depth limiters, and loop-breaking circuit breakers in `backend/agent/circuit_breaker.py` to prevent runaway LLM generation, repetitive tool cycling, and infinite self-correction loops.

## 2. Requirement Mapping
- **SIH26117 Requirement 07:** *ITERATIVE SELF-CORRECTION LOOP* — Hard upper limit of 10 iterations.
- **SIH26117 Requirement 06:** *AGENTIC PLANNING & TOOL CALLING* — Controlled, deterministic agent execution.

## 3. Detailed Design & Technical Approach

### 3.1. Circuit Breaker Parameters & Traps
1. **Iteration Limit:** Strict hard stop at **10 iterations**.
2. **Execution Timeout:** Total wall-clock agent timeout capped at **60.0 seconds** per task.
3. **Repetitive Action Trap:** Detects if the agent calls the same tool with identical input parameters $\ge 3$ consecutive times.
4. **No-Progress Watchdog:** If 4 consecutive iterations yield runtime errors without new observations, the breaker triggers early exit.

### 3.2. Circuit Breaker Implementation (`backend/agent/circuit_breaker.py`)
```python
import time
from typing import List, Dict, Any, Optional

class AgentCircuitBreaker:
    def __init__(self, max_iterations: int = 10, max_duration_seconds: float = 60.0):
        self.max_iterations = max_iterations
        self.max_duration_seconds = max_duration_seconds
        self.start_time = time.perf_counter()
        self.iteration_count = 0
        self.action_history: List[str] = []

    def check_iteration(self, action_name: str, action_input: str) -> Optional[str]:
        self.iteration_count += 1
        elapsed = time.perf_counter() - self.start_time

        # Check 1: Max iterations exceeded
        if self.iteration_count > self.max_iterations:
            return f"CIRCUIT_BREAKER_TRIGGERED: Maximum iteration limit ({self.max_iterations}) reached."

        # Check 2: Wall-clock timeout exceeded
        if elapsed > self.max_duration_seconds:
            return f"CIRCUIT_BREAKER_TRIGGERED: Execution timeout ({self.max_duration_seconds}s) exceeded."

        # Check 3: Repetitive action cycle
        call_signature = f"{action_name}::{action_input.strip()}"
        self.action_history.append(call_signature)
        if len(self.action_history) >= 3 and self.action_history[-1] == self.action_history[-2] == self.action_history[-3]:
            return "CIRCUIT_BREAKER_TRIGGERED: Repetitive tool loop detected (same tool & input called 3 times)."

        return None
```

## 4. Inputs / Outputs & Contracts
- **Input:** Current tool name, input arguments, current elapsed time.
- **Output:** `None` if safe to proceed, or error message string if circuit breaker triggers.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md).
- Depended on by: [Plan 20](file:///G:/SIH/p/docs/plans/20_self_correction_loop.md), [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).

## 6. Edge Cases & Failure Modes
- **Complex Multi-Step Task Taking 50 Seconds:** Timer allows legitimate slow tasks to run up to 60s before termination.

## 7. Acceptance Criteria & Verification
- Unit test simulating an infinite loop stops cleanly on iteration 10 with diagnostic message.
- Unit test simulating identical repeated action calls halts after 3 repetitions.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** 60-second task ceiling is selected to accommodate up to 3 Docker runs (15s each) plus local OCR and LLM reasoning latency.
