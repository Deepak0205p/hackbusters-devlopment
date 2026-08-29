# Plan 45: Backend Automated Testing Plan (pytest & Coverage Targets)

## 1. Objective
Establish the automated unit and integration test suite using `pytest` and `pytest-asyncio`, enforcing $> 90\%$ code coverage across all backend engines (Router, Model Manager, RAG, Tools, Sovereignty Daemon, FastAPI Routes) with offline mock adapters.

## 2. Requirement Mapping
- **SIH26117 Requirement 01 - 12:** System-wide software reliability, stability, and zero-crash verification.

## 3. Detailed Design & Technical Approach

### 3.1. Test Suite Directory Structure (`tests/`)
```
tests/
├── conftest.py                   # Pytest fixtures, mock Ollama client, mock Docker client
├── test_router.py                # Stage 1 regex & Stage 2 semantic routing tests
├── test_model_manager.py         # LRU model swapping & VRAM ceiling tests
├── test_rag_engine.py            # ChromaDB ingestion, embedding, and citation tests
├── test_docker_sandbox.py        # Sandbox execution, timeout, and memory cap tests
├── test_deliverables.py          # .docx, .xlsx, .pptx generator tests
├── test_sovereignty_daemon.py    # Socket auditor, packet sniffer, hash chain tests
└── test_api_routes.py            # FastAPI REST endpoints & WebSocket tests
```

### 3.2. Pytest Configuration (`pytest.ini`)
```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --cov=backend --cov-report=term-missing --cov-report=html
```

### 3.3. Mock Ollama Fixture (`tests/conftest.py`)
```python
import pytest
from unittest.mock import AsyncMock

@pytest.fixture
def mock_ollama():
    mock = AsyncMock()
    async def fake_generate_stream(*args, **kwargs):
        yield "Calculated result: "
        yield "26.04 kW efficiency 74.4%"
    mock.generate_stream = fake_generate_stream
    mock.unload_model = AsyncMock(return_value=True)
    return mock
```

## 4. Inputs / Outputs & Contracts
- **Input:** Test suite execution command `pytest`.
- **Output:** Test results matrix, coverage percentage report, and execution timing.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).
- Depended on by: [Plan 50](file:///G:/SIH/p/docs/plans/50_judge_verification_checklist.md).

## 6. Edge Cases & Failure Modes
- **Running Tests in Environment Without Docker Daemon:** Test fixtures detect missing Docker socket and execute in mocked sandbox mode during CI.

## 7. Acceptance Criteria & Verification
- `pytest` runs with 100% passed tests (0 failures, 0 errors).
- Overall backend statement test coverage exceeds $90.0\%$.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Using `pytest-asyncio` with mock fixtures allows rapid local unit testing ($< 5\text{ seconds}$ total runtime) without needing active GPU inference for regression testing.
