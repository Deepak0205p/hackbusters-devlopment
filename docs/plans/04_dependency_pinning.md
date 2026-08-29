# Plan 04: Dependency Pinning Strategy & Manifest Creation

## 1. Objective
Lock all backend Python dependencies in `requirements.txt` and frontend Node dependencies in `package.json` with exact version pinning, eliminating version drift, missing sub-dependencies, and runtime installation errors in offline environments.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED & AIR-GAPPED* — Reproducible, zero-network runtime installation.
- **SIH26117 Requirement 05:** *EXTENSIBLE MODEL REGISTRY* — Stable PyYAML integration.

## 3. Detailed Design & Technical Approach

### 3.1. Backend Dependency Manifest (`requirements.txt`)
Exact pinned versions matching [docs/tech_stack.md](file:///G:/SIH/p/docs/tech_stack.md):
```txt
fastapi==0.111.0
uvicorn[standard]==0.30.1
pydantic==2.7.4
pydantic-settings==2.3.4
python-multipart==0.0.9
websockets==12.0
pyyaml==6.0.1
langchain==0.2.11
langchain-core==0.2.23
langchain-community==0.2.10
httpx==0.27.0
chromadb==0.5.4
sentence-transformers==3.0.1
torch==2.3.1
pypdf==4.3.1
pdfplumber==0.11.2
paddleocr==2.8.1
pytesseract==0.3.10
Pillow==10.4.0
python-docx==1.1.2
openpyxl==3.1.5
python-pptx==0.6.23
docker==7.1.0
pynvml==11.5.0
psutil==6.0.0
scapy==2.5.0
pytest==8.2.2
pytest-asyncio==0.23.8
pytest-cov==5.0.0
```

### 3.2. Frontend Dependency Manifest (`frontend/package.json`)
```json
{
  "name": "mrpl-sovereign-workbench-ui",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "zustand": "4.5.4",
    "lucide-react": "0.395.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.3.0"
  },
  "devDependencies": {
    "tailwindcss": "3.4.4",
    "postcss": "8.4.39",
    "autoprefixer": "10.4.19"
  }
}
```

## 4. Inputs / Outputs & Contracts
- **Input:** Tech stack specifications from `docs/tech_stack.md`.
- **Output:** Pinned `requirements.txt` at root and `frontend/package.json`.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 01](file:///G:/SIH/p/docs/plans/01_environment_setup.md), [Plan 02](file:///G:/SIH/p/docs/plans/02_folder_structure.md).
- Depended on by: [Plan 05](file:///G:/SIH/p/docs/plans/05_model_download_verification.md), [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md), [Plan 46](file:///G:/SIH/p/docs/plans/46_nextjs_static_export.md).

## 6. Edge Cases & Failure Modes
- **C++ Build Dependency on Windows:** Packages like `psutil` or `scapy` requiring MSVC build tools. Ensure pre-compiled binary wheels (`.whl`) are installed.
- **PyTorch CUDA Wheel Resolution:** In Windows, install torch using official CUDA 12.1 wheel index if default pip wheel lacks CUDA runtime.

## 7. Acceptance Criteria & Verification
- `pip check` reports 0 broken dependencies or version conflicts.
- `npm list` in `frontend/` reports 0 missing peer dependencies.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Strict exact pinning (`==`) is enforced rather than loose ranges (`^` or `>=`) to guarantee 100% build reproducibility during hackathon judging.
