# HackBuster: Sovereign On-Premise Agentic AI Workbench (SIH26117)

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()
[![Air-Gapped](https://img.shields.io/badge/Compliance-100%25%20Air--Gapped-success.svg)]()

An enterprise-grade, 100% air-gapped, on-premise agentic AI platform designed for critical infrastructure and refinery operations (e.g., MRPL/ONGC). It operates strictly within on-premise hardware constraints ($\le 6.0\text{ GB}$ VRAM) with zero external internet egress.

---

## Key Features

- **100% Air-Gapped & Zero-Cloud Invariant:** Zero remote cloud API calls (no OpenAI/Anthropic/telemetry SaaS). Fully offline execution verified by an integrated kernel-level packet sniffer and SHA-256 audit ledger.
- **Dynamic LRU VRAM Swapping:** Runs 4 open-weight GGUF models within a strict $\le 6.0\text{ GB}$ VRAM ceiling using dual-slot memory management.
- **Multimodal Document & P&ID Ingestion:** Local OCR (PaddleOCR/Tesseract) for refinery inspection reports, tabular logs, and ISA 5.1 CAD/P&ID engineering drawings.
- **Isolated Code Execution Sandbox:** Docker container (`python:3.11-slim`, `--network none`, 2 vCPU, 512 MB RAM limit) for safe analytical and hydraulic calculation execution.
- **Enterprise Deliverable Synthesis:** Automated generation of production-ready `.docx` briefing notes, `.xlsx` asset calculation registers, and `.pptx` presentations.
- **Unified Dual-App UI:**
  - **Public Chat Interface:** Clean, reactive chat interface with real-time reasoning steps and deliverable previews.
  - **Admin Observatory Dashboard:** Live observability into VRAM usage, active models, network socket sniffer, and audit ledger.

---

## Tech Stack & Architecture

- **Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic, LangChain ReAct
- **Frontend:** Next.js 14 (Static Export), React, Tailwind CSS, Lucide React, Zustand
- **Local AI Engine:** Ollama (`qwen3:4b-q4_k_m`, `qwen2.5-coder:3b-q4_k_m`, `qwen2-vl:2b-q4_k_m`, `llama3.2:3b-q4_k_m`)
- **Vector DB / RAG:** ChromaDB (Local embedded), `BAAI/bge-small-en-v1.5` embeddings
- **Security & Sandboxing:** Docker Engine 24.0+, `scapy`, `psutil`

---

## Prerequisites

1. **Operating System:** Windows 10/11 (64-bit) or Ubuntu 22.04+ LTS
2. **Python:** Python 3.11 (`python --version`)
3. **Node.js:** Node.js v18+ & npm (`node -v`, `npm -v`)
4. **Ollama:** Installed and available locally (`ollama --version`)
5. **Docker:** Docker Desktop or Docker Engine running (for sandboxed execution)

---

## Getting Started & How to Run

### Step 1: Clone the Repository
```bash
git clone https://github.com/Deepak0205p/hackbusters-devlopment.git
cd hackbusters-devlopment
```

---

### Step 2: Set Up Python Backend Environment

1. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r apps/admin_backend/requirements.txt
   ```

---

### Step 3: Setup Local Models (Ollama)

1. Start the Ollama service:
   ```bash
   ollama serve
   ```

2. Pull the required quantized models:
   ```bash
   ollama pull qwen2.5:3b
   ollama pull qwen2.5-coder:3b
   ollama pull llama3.2:3b
   ```

---

### Step 4: Build Frontends (Static Export)

Build both the chat and admin frontends into static output directories (`out`):

```bash
# 1. Build Chat Frontend
cd apps/chat-frontend
npm install
npm run build
cd ../..

# 2. Build Admin Frontend
cd apps/admin-frontend
npm install
npm run build
cd ../..
```

*(Note: In development mode, you can also run `npm run dev` inside either frontend directory if you want live hot-reloading).*

---

### Step 5: Start the Unified Server

Run the unified FastAPI server from the project root:

```bash
python -m uvicorn apps.admin_backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### Step 6: Access the Applications

Open your browser and navigate to:

- **Public Chat Interface:** [`http://localhost:8000/`](http://localhost:8000/)
- **Admin Observatory Dashboard:** [`http://localhost:8000/admin/`](http://localhost:8000/admin/)
- **Backend API Docs (Swagger):** [`http://localhost:8000/docs`](http://localhost:8000/docs)
- **Health Check Endpoint:** [`http://localhost:8000/api/health`](http://localhost:8000/api/health)

---

## Project Directory Structure

```text
.
├── apps/
│   ├── admin_backend/     # FastAPI application, agent orchestrator, tools, router
│   ├── admin-frontend/    # Admin Observatory Next.js application
│   └── chat-frontend/     # End-user Chat Next.js application
├── data/
│   ├── annual_reports/    # Pre-indexed industrial annual reports
│   ├── mrpl_documents/    # Industrial SOPs, Safety guidelines, CSB reports
│   ├── ongc_policies/     # Policy documents
│   ├── chroma_db/         # Persistent embedded vector store
│   └── sample_inputs/     # Inspection PDFs & ISA 5.1 P&ID diagrams
├── docs/                  # System architecture, PRDs, runbooks & evaluation plans
├── models/                # Declarative models.yaml configuration
├── scripts/               # Utility and environment verification scripts
└── .gitignore             # Ignored node_modules, build artifacts, logs
```

---

## License & Sovereignty Notice
This project is built under the Smart India Hackathon (SIH26117) guidelines for autonomous, sovereign, on-premise industrial AI workstations.
