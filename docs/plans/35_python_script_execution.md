# Plan 35: Python Script Execution & Result Capture Engine

## 1. Objective
Design the execution manager in `backend/tools/docker_sandbox.py` that receives generated Python code, writes ephemeral script files to `data/outputs/scripts/`, spins up the Docker sandbox, captures standard output and error streams, and returns structured execution metrics.

## 2. Requirement Mapping
- **SIH26117 Requirement 06:** *AGENTIC PLANNING & TOOL CALLING* — Sandboxed code execution.
- **SIH26117 Requirement 15:** *CODING TASK EXECUTED IN SANDBOX* — Safely generates and executes pump efficiency Python scripts.

## 3. Detailed Design & Technical Approach

### 3.1. Sandbox Execution Tool Implementation (`backend/tools/docker_sandbox.py`)
```python
import os
import time
import uuid
import subprocess
import asyncio
from typing import Dict, Any
from backend.tools.base import BaseTool

class DockerSandboxTool(BaseTool):
    name = "docker_python_sandbox"
    description = "Executes arbitrary Python code safely inside an isolated Docker sandbox with no network access."

    def __init__(self, script_dir: str = "data/outputs/scripts", timeout_seconds: float = 15.0):
        self.script_dir = script_dir
        self.timeout_seconds = timeout_seconds
        os.makedirs(script_dir, exist_ok=True)

    async def _run(self, code: str, **kwargs) -> Dict[str, Any]:
        # Clean markdown codeblocks if model wrapped code in ```python ... ```
        clean_code = code.strip()
        if clean_code.startswith("```"):
            lines = clean_code.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_code = "\n".join(lines).strip()

        # Write code to host temporary script file
        script_id = f"calc_{uuid.uuid4().hex[:8]}"
        script_filename = f"{script_id}.py"
        host_script_path = os.path.abspath(os.path.join(self.script_dir, script_filename))
        
        with open(host_script_path, "w", encoding="utf-8") as f:
            f.write(clean_code)

        # Build Docker execution command
        # Note: on Windows, convert backslashes to forward slashes for Docker mount
        mount_path = host_script_path.replace("\\", "/")
        cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "--cpus=2.0",
            "--memory=512m",
            "--memory-swap=512m",
            "--pids-limit", "100",
            "-v", f"{mount_path}:/home/sandboxuser/app/script.py:ro",
            "sih-python-sandbox:3.11",
            "python3", "/home/sandboxuser/app/script.py"
        ]

        start_time = time.perf_counter()
        try:
            # Run asynchronously with timeout
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(),
                    timeout=self.timeout_seconds
                )
                duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                exit_code = proc.returncode
                stdout_str = stdout_bytes.decode("utf-8", errors="replace")
                stderr_str = stderr_bytes.decode("utf-8", errors="replace")

                return {
                    "status": "SUCCESS" if exit_code == 0 else "EXECUTION_ERROR",
                    "exit_code": exit_code,
                    "stdout": stdout_str.strip(),
                    "stderr": stderr_str.strip(),
                    "execution_time_ms": duration_ms,
                    "saved_script_path": host_script_path,
                    "download_url": f"/api/files/download/{script_filename}"
                }
            except asyncio.TimeoutError:
                proc.kill()
                return {
                    "status": "TIMEOUT_ERROR",
                    "exit_code": -1,
                    "stdout": "",
                    "stderr": f"Execution timed out after {self.timeout_seconds} seconds.",
                    "execution_time_ms": self.timeout_seconds * 1000,
                    "saved_script_path": host_script_path
                }
        except Exception as e:
            return {
                "status": "HOST_ERROR",
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Failed to spawn Docker sandbox: {e}",
                "saved_script_path": host_script_path
            }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Raw Python code string.
- **Output:** Structured execution dictionary containing `exit_code`, `stdout`, `stderr`, and `download_url`.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 06](file:///G:/SIH/p/docs/plans/06_docker_sandbox_setup.md), [Plan 19](file:///G:/SIH/p/docs/plans/19_tool_calling_interface.md), [Plan 34](file:///G:/SIH/p/docs/plans/34_docker_sandbox_arch.md).
- Depended on by: [Plan 36](file:///G:/SIH/p/docs/plans/36_traceback_feedback_loop.md), [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Code Attempting File I/O:** Script cannot write to host filesystem because root is read-only; output values must be printed to `stdout` or `/tmp`.

## 7. Acceptance Criteria & Verification
- Valid mathematical calculation script executes and outputs accurate results in $< 1.5\text{ seconds}$.
- Saved script `.py` is immediately downloadable from `/api/files/download/{filename}`.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Saving the generated Python script to `data/outputs/scripts/` fulfills the requirement to provide standalone, executable, commented Python code deliverables.
