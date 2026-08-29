# Plan 20: Self-Correction Loop & Traceback Parsing Logic

## 1. Objective
Design the iterative self-correction engine in `backend/agent/self_correction.py`, parsing runtime exceptions, tracebacks, and validation failures from local tools and feeding structured error feedback into subsequent reasoning turns up to a maximum of 10 iterations.

## 2. Requirement Mapping
- **SIH26117 Requirement 07:** *ITERATIVE SELF-CORRECTION LOOP* — The agent must inspect its own execution outputs, validate quality, and iteratively correct errors (up to 10 iterations) instead of single-pass failure.

## 3. Detailed Design & Technical Approach

### 3.1. Traceback Analyzer & Feedback Formatter (`backend/agent/self_correction.py`)
```python
import re
from typing import Dict, Any, Optional

class TracebackParser:
    @staticmethod
    def parse_python_error(stderr: str) -> Dict[str, Any]:
        """Extract exception class, line number, and error message from Python stderr."""
        lines = stderr.strip().split("\n")
        last_line = lines[-1] if lines else "Unknown Error"
        
        # Match error class (e.g. TypeError, SyntaxError, ZeroDivisionError, NameError)
        match = re.match(r'^([a-zA-Z_0-9]+Error|Exception):\s*(.*)$', last_line)
        if match:
            error_class = match.group(1)
            error_msg = match.group(2)
        else:
            error_class = "RuntimeError"
            error_msg = last_line

        # Find line number
        line_num = None
        for line in reversed(lines):
            line_match = re.search(r'File ".*", line (\d+)', line)
            if line_match:
                line_num = int(line_match.group(1))
                break

        return {
            "error_class": error_class,
            "error_message": error_msg,
            "line_number": line_num,
            "raw_traceback": stderr
        }

    @staticmethod
    def construct_feedback_prompt(parsed_error: Dict[str, Any], attempt: int, max_attempts: int = 10) -> str:
        return (
            f"\n[EXECUTION ERROR on attempt {attempt}/{max_attempts}]:\n"
            f"Error Type: {parsed_error['error_class']}\n"
            f"Message: {parsed_error['error_message']}\n"
            f"At line: {parsed_error['line_number']}\n"
            f"Traceback:\n{parsed_error['raw_traceback']}\n\n"
            f"Analyze what went wrong, fix the syntax or variable assignment, and re-execute."
        )
```

### 3.2. Self-Correction Loop Control Flow
```python
async def execute_react_with_self_correction(agent, prompt, max_iterations=10):
    iteration = 0
    while iteration < max_iterations:
        iteration += 1
        step_result = await agent.step()
        
        if step_result.is_final:
            return step_result.final_answer
            
        if step_result.tool_failed:
            parsed = TracebackParser.parse_python_error(step_result.error_output)
            feedback = TracebackParser.construct_feedback_prompt(parsed, iteration, max_iterations)
            agent.inject_feedback(feedback)
            continue
            
    return "Agent reached maximum iteration limit (10) without resolving the task."
```

## 4. Inputs / Outputs & Contracts
- **Input:** Tool execution `stderr` / failure JSON, current iteration count ($1..10$).
- **Output:** Parsed exception dictionary and structured feedback text injected into agent context.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md), [Plan 19](file:///G:/SIH/p/docs/plans/19_tool_calling_interface.md), [Plan 35](file:///G:/SIH/p/docs/plans/35_python_script_execution.md).
- Depended on by: [Plan 22](file:///G:/SIH/p/docs/plans/22_agent_trace_logging.md), [Plan 36](file:///G:/SIH/p/docs/plans/36_traceback_feedback_loop.md).

## 6. Edge Cases & Failure Modes
- **Indentation / Syntax Errors in Generated Python:** Parser highlights exact line number, allowing Qwen 2.5 Coder to rewrite the function body accurately.
- **Max Iterations Reached (10/10):** Terminate gracefully and summarize attempted steps and last known error to user.

## 7. Acceptance Criteria & Verification
- Unit test injects code with deliberate `ZeroDivisionError` and `TypeError`; agent analyzes traceback, fixes error, and successfully completes calculation within 3 iterations.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Explicitly formatting the error class and line number as a concise prompt header helps smaller 3B models focus immediately on the broken line.
