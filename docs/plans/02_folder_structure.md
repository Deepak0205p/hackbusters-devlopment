# Plan 02: Folder Structure Finalization & Directory Scaffolding

## 1. Objective
Scaffold the complete modular filesystem hierarchy for backend, frontend, local storage, sandbox, and deliverable repositories, ensuring strict separation of concerns and deterministic paths.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED & AIR-GAPPED* — Strict local directory containment.
- **SIH26117 Requirement 10:** *PRODUCTION DELIVERABLE GENERATION* — Dedicated directories for `.docx`, `.xlsx`, `.pptx`, `.py` outputs.
- **SIH26117 Requirement 11:** *GROUNDED LOCAL KNOWLEDGE BASE* — Persistent local vector storage directory.

## 3. Detailed Design & Technical Approach
Create the canonical directory hierarchy matching [docs/file_structure.md](file:///G:/SIH/p/docs/file_structure.md):
- `backend/`: `config/`, `core/`, `agent/`, `rag/`, `tools/`, `api/`.
- `frontend/`: `src/app/`, `src/components/`, `src/store/`, `src/lib/`, `out/`.
- `data/`: `chromadb/`, `sop_docs/`, `sample_inputs/`, `models/paddleocr/`, `outputs/` (`docx/`, `xlsx/`, `pptx/`, `scripts/`).
- `sandbox/`: `Dockerfile.sandbox`, `entrypoint.sh`.

### Directory Initialization Script:
```python
import os

REQUIRED_DIRS = [
    "backend/config", "backend/core", "backend/agent", "backend/rag", "backend/tools", "backend/api",
    "frontend/src/app", "frontend/src/components/Chat", "frontend/src/components/Sovereignty",
    "frontend/src/components/Models", "frontend/src/components/Ingestion", "frontend/src/components/Deliverables",
    "frontend/src/store", "frontend/src/lib", "frontend/out",
    "data/chromadb", "data/sop_docs", "data/sample_inputs", "data/models/paddleocr",
    "data/outputs/docx", "data/outputs/xlsx", "data/outputs/pptx", "data/outputs/scripts",
    "sandbox"
]

for d in REQUIRED_DIRS:
    os.makedirs(d, exist_ok=True)
    init_py = os.path.join(d, "__init__.py")
    if d.startswith("backend") and not os.path.exists(init_py):
        with open(init_py, "w") as f:
            f.write("# Package init\n")
```

## 4. Inputs / Outputs & Contracts
- **Input:** Project root path `G:/SIH/p`.
- **Output:** Verified physical directories and Python package `__init__.py` markers.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 01](file:///G:/SIH/p/docs/plans/01_environment_setup.md).
- Depended on by: All subsequent backend and frontend plan files.

## 6. Edge Cases & Failure Modes
- **Windows Path Separators:** Windows backslashes (`\`) vs POSIX slashes (`/`). All Python path operations must use `pathlib.Path` or `os.path.join` to avoid platform bugs.
- **Permission Errors in Output Dirs:** Verify write permissions on `data/outputs/` at startup.

## 7. Acceptance Criteria & Verification
- All 24 target directories exist on the filesystem.
- Python imports `backend.core`, `backend.agent`, `backend.rag`, `backend.tools`, `backend.api` resolve without `ModuleNotFoundError`.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** `data/outputs/` is partitioned by deliverable type (`docx/`, `xlsx/`, `pptx/`, `scripts/`) to prevent file collisions during concurrent agent runs.
