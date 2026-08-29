# Plan 06: Docker Sandbox Environment Setup & Network Isolation

## 1. Objective
Design and configure the isolated Docker execution sandbox image (`sih-python-sandbox:3.11`), enforcing strict non-networked execution (`--network none`), resource caps (2 vCPU, 512MB RAM), and timeout limits for safe execution of AI-generated Python code.

## 2. Requirement Mapping
- **SIH26117 Requirement 06:** *AGENTIC PLANNING & TOOL CALLING* — Sandboxed code execution tool.
- **SIH26117 Requirement 15:** *CODING TASK EXECUTED IN SANDBOX* — Isolated Docker container with zero network access.

## 3. Detailed Design & Technical Approach

### 3.1. Sandbox Dockerfile (`sandbox/Dockerfile.sandbox`)
```dockerfile
FROM python:3.11-slim

# Prevent python from writing pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create non-root unprivileged runner user
RUN useradd -m -u 1000 sandboxuser

# Install essential scientific and engineering packages offline
RUN pip install --no-cache-dir \
    numpy==1.26.4 \
    scipy==1.13.1 \
    pandas==2.2.2 \
    matplotlib==3.9.0 \
    sympy==1.12.1

WORKDIR /home/sandboxuser/app
USER sandboxuser

CMD ["python3"]
```

### 3.2. Container Execution Flags & Security Policy
When the FastAPI backend spawns the sandbox, it must enforce the following flags:
```bash
docker run --rm \
  --network none \
  --cpus="2.0" \
  --memory="512m" \
  --memory-swap="512m" \
  --pids-limit 100 \
  --security-opt=no-new-privileges \
  --read-only \
  --tmpfs /tmp:rw,size=64m \
  -v "G:/SIH/p/data/outputs/scripts/temp_script.py:/home/sandboxuser/app/script.py:ro" \
  sih-python-sandbox:3.11 \
  python3 /home/sandboxuser/app/script.py
```

## 4. Inputs / Outputs & Contracts
- **Input:** Generated Python code string from Qwen 2.5 Coder.
- **Output:** Container execution `stdout`, `stderr`, `exit_code`, and execution latency in milliseconds.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 01](file:///G:/SIH/p/docs/plans/01_environment_setup.md), [Plan 02](file:///G:/SIH/p/docs/plans/02_folder_structure.md).
- Depended on by: [Plan 34](file:///G:/SIH/p/docs/plans/34_docker_sandbox_arch.md), [Plan 35](file:///G:/SIH/p/docs/plans/35_python_script_execution.md), [Plan 36](file:///G:/SIH/p/docs/plans/36_traceback_feedback_loop.md).

## 6. Edge Cases & Failure Modes
- **Docker Daemon Not Running:** Fallback to local subprocess execution inside restricted tempdir with warning flag, prompting user to start Docker Desktop.
- **Infinite Loop in Generated Code:** Hard timeout killer kills container after 15 seconds.
- **Fork Bombs:** Mitigated by `--pids-limit 100`.

## 7. Acceptance Criteria & Verification
- `docker run --rm --network none sih-python-sandbox:3.11 python3 -c "import urllib.request; urllib.request.urlopen('http://1.1.1.1')"` raises `URLError` / network unreachable.
- Execution of mathematical script `numpy` / `scipy` calculates and outputs numerical results correctly.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** 2.0 vCPU and 512MB RAM are chosen as generous boundaries for mathematical pump calculations while preventing runaway resource starvation on a 16GB host laptop.
