# Locked Technology Stack & Dependency Specification
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

This document is the **single source of truth** for all technologies, runtime frameworks, hardware constraints, and pinned dependency versions used across the platform. No library or framework may be added, upgraded, or substituted without explicit user approval.

---

## 1. Operating System & Hardware Baseline

- **Operating System:** Ubuntu 22.04 LTS / Windows 11 (64-bit)
- **Target GPU:** NVIDIA GeForce RTX 3050 (6.0 GB VRAM) / RTX 4060 (8.0 GB VRAM)
- **VRAM Ceiling:** Strict **6.0 GB physical hardware ceiling**
- **CUDA Runtime:** NVIDIA CUDA 12.2+ with cuDNN 8.9+
- **System Memory (RAM):** 16 GB DDR4/DDR5 baseline
- **CPU:** AMD Ryzen 5 class (6 cores / 12 threads) or Intel Core i5 equivalent

---

## 2. Model Serving Layer

- **Model Serving Runtime:** **Ollama** (`http://127.0.0.1:11434`)
  - *Hard Prohibition:* No vLLM, LM Studio, or text-generation-webui in single-laptop Tier 1.
- **Model Format & Quantization:** **GGUF** format with **Q4_K_M** quantization exclusively.
- **Exact Model Inventory (Strictly Locked — No Substitutions):**
  1. **Reasoning & Planning:** `Qwen 3 4B` (`qwen3:4b-q4_k_m`) — 2.8 GB VRAM
  2. **Code Generation & Math:** `Qwen 2.5 Coder 3B` (`qwen2.5-coder:3b-q4_k_m`) — 2.0 GB VRAM
  3. **Multimodal Vision & Schematics:** `Qwen2-VL 2B` (`qwen2-vl:2b-q4_k_m`) — 2.0 GB VRAM
  4. **General Assistant & Fallback:** `Llama 3.2 3B` (`llama3.2:3b-q4_k_m`) — 2.0 GB VRAM
- **Model Registry Format:** `models.yaml` (declarative, hot-reloadable, auto-scanned without server restart).

---

## 3. Backend Application Stack

- **Language & Runtime:** Python 3.11 (64-bit)
- **Web API Framework:** **FastAPI 0.111.0** (fully asynchronous `async/await` pipeline)
- **ASGI Server:** **Uvicorn 0.30.1** (strictly bound to `127.0.0.1:8000`)
- **Agent Orchestration:** **LangChain 0.2.11** (Strict ReAct Reason+Act loop, max 10 iterations)
  - *Constraint:* LangGraph is excluded unless explicitly requested.
- **Environment & Dependency Manager:** Standard Python `venv` (recommended for zero-overhead local air-gapped setup) or `poetry`.
  - `TODO: confirm with user`: Final confirmation on `venv` vs. `poetry` for environment management.

---

## 4. Local Vector Store & RAG Engine

- **Vector Database:** **ChromaDB 0.5.4** (Local Embedded Mode using persistent SQLite storage in `data/chromadb/`).
  - *Prohibition:* Client-server ChromaDB and cloud vector stores are barred.
- **Local Embedding Model:** **`BAAI/bge-small-en-v1.5`** (384-dimensional dense vectors) executed locally via `sentence-transformers 3.0.1`.
  - `TODO: confirm with user`: Using `sentence-transformers` (cleaner Python API) vs. `FlagEmbedding`.
- **Document Chunking & Parsing:**
  - Standard PDF parsing: `pypdf 4.3.1` and `pdfplumber 0.11.2`.
  - Standard DOCX parsing: `python-docx 1.1.2`.
  - *Decision Note:* `unstructured` is deliberately excluded to prevent bloated heavyweight C++ dependencies.

---

## 5. Local OCR & Vision Pipeline

- **Primary OCR Engine:** **PaddleOCR 2.8.1** (configured in 100% offline mode with pre-downloaded, cached ONNX/PyTorch model weights in `data/models/paddleocr/`).
  - *Hard Rule:* Runtime automatic downloading of model weights is disabled.
- **Fallback OCR Engine:** **Tesseract OCR 5.3+** (via `pytesseract 0.3.10`) running on CPU.
- **Vision-Language Processing:** `Qwen2-VL 2B` served locally through Ollama (no external vision cloud APIs).

---

## 6. Enterprise Deliverable Generators (Office Outputs)

- **Microsoft Word (.docx):** `python-docx 1.1.2` (formatted approval notes, memos, headers, tables, SOP citations).
- **Microsoft Excel (.xlsx):** `openpyxl 3.1.5` (structured equipment asset registers, calculation matrices).
- **Microsoft PowerPoint (.pptx):** `python-pptx 0.6.23` (technical presentation slide decks).
- **Python Automation Script (.py):** Direct native file serialization with syntax formatting.
- *Strict Prohibition:* Zero cloud document APIs (no Microsoft Graph API, no Google Docs API, no Cloudmersive).

---

## 7. Isolated Code Execution Sandbox

- **Sandbox Engine:** **Docker Engine 24.0+** (container-based sandboxing).
- **Container Base Image:** `python:3.11-slim` pre-installed with scientific libraries (`numpy`, `scipy`, `pandas`, `matplotlib`, `sympy`).
- **Sandbox Network Policy:** **`--network none`** (Hard statutory requirement; zero host or external network bridge).
- **Resource Limits & Guardrails:**
  - Maximum CPU cores: **2.0 vCPU** (`--cpus="2.0"`)
  - Maximum RAM: **512 MB** (`--memory="512m"` `--memory-swap="512m"`)
  - Hard Execution Timeout: **15.0 seconds**
  - Ephemeral Volume Mount: Read-only script mount, isolated `/tmp/output` directory.

---

## 8. Network Sovereignty & Air-Gap Watchdog

- **Process & Socket Inspection:** **`psutil 6.0.0`** (Continuous 1000ms scanning of all process PIDs, listening ports, and connection endpoints).
- **Packet-Level Sniffing Engine:** **`scapy 2.5.0`** (Pure Python packet sniffing attached to network interfaces with filter: `not (ip src 127.0.0.1 and ip dst 127.0.0.1)`).
  - *Option comparison:* Scapy is pure Python and self-contained; Pyshark requires external Wireshark `tshark.exe` binary.
  - `TODO: confirm with user`: Confirm Scapy as primary pure-Python packet sniffer vs. Pyshark.
- **Tamper-Evident Logging:** SHA-256 Hash Chaining:
  $$\text{Block}_{n}.\text{Hash} = \text{SHA256}(\text{Block}_{n-1}.\text{Hash} + \text{Payload}_n + \text{Timestamp}_n)$$
  Stored locally at `data/outputs/sovereignty_audit.log`.

---

## 9. Frontend Application Stack & UI Libraries (Next.js Static Export + Tailwind + Radix + Framer Motion)

- **Framework:** **Next.js 14.2.5** (App Router)
- **Deployment Mode:** **Static Export (`output: 'export'`) Exclusively**
  - *Architectural Rationale:* This is a single-workstation, offline, air-gapped deployment. Running two concurrent web servers (a Node.js SSR runtime + FastAPI) introduces unnecessary resource overhead, memory consumption, and attack surface. Static export compiles the Next.js App Router application into an optimized pure static directory (`frontend/out`), which is served directly by FastAPI via `StaticFiles(directory="frontend/out", html=True)` on port `8000`.
  - *Rule on SSR / API Routes:* No Server-Side Rendering (SSR), no Next.js Server Actions requiring a Node.js daemon, and no Next.js API route handlers. The FastAPI backend remains the single source of truth for all API contracts, file streams, and WebSocket channels.
- **Styling:** **Tailwind CSS 3.4.4** + `postcss 8.4.39` + `autoprefixer 10.4.19` (dark industrial palette `#020617` / `#0f172a`, emerald `#10b981`, amber `#f59e0b`).
- **Accessible UI Primitives (shadcn/ui base):**
  - `@radix-ui/react-dialog 1.1.1` (QR Connect & Model Config modals)
  - `@radix-ui/react-tabs 1.1.0` (Scenario & screen navigation)
  - `@radix-ui/react-accordion 1.2.0` (Streaming ReAct thought trace steps)
  - `@radix-ui/react-tooltip 1.1.2` (Telemetry badges & technical hints)
  - `@radix-ui/react-progress 1.1.0` (Hardware VRAM usage gauges)
  - `@radix-ui/react-slot 1.1.0` (Button composition)
- **Animation Engine:** **Framer Motion 11.3.19** (Hardware-accelerated spring physics and `AnimatePresence` layout transitions).
- **Utility & Styling Helpers:** `clsx 2.1.1` + `tailwind-merge 2.4.0` + `class-variance-authority 0.7.0`.
- **Icons:** **Lucide React 0.395.0** (bundled offline vector icons).
- **State Management:** **Zustand 4.5.4** (client-only stores in browser memory; zero SSR hydration mismatch).
- **Real-Time Streaming:** **FastAPI Native WebSockets** (`ws://<host>:8000/api/chat/stream` and `/api/audit-stream`).

---

## 10. Explicitly Forbidden Technologies & Services

The following technologies are **STRICTLY PROHIBITED** from appearing anywhere in the runtime codebase:

| Category | Forbidden Technologies | Reason for Prohibition |
| :--- | :--- | :--- |
| **Cloud LLM APIs** | OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI, AWS Bedrock, Mistral SaaS, Groq Cloud, Cohere | Violates statutory air-gap mandate and MRPL confidentiality. |
| **Cloud Vector Databases** | Pinecone, Weaviate Cloud, Qdrant Cloud, Milvus Cloud, Zilliz | Data leakage risk; must use local embedded ChromaDB. |
| **Cloud Storage** | AWS S3, Google Cloud Storage, Azure Blob, Supabase Storage | All refinery files must remain on local host disk. |
| **Cloud Telemetry & Analytics** | Sentry Cloud, PostHog Cloud, Datadog SaaS, Segment, Mixpanel, Google Analytics | Violates zero-external-egress network boundary. |
| **Auth-as-a-Service** | Auth0, Clerk, Firebase Auth, Descope, Supabase Auth | System runs on dedicated local workstation with no external auth server. |
| **Auto-Phoning ML Libraries** | WandB, HuggingFace telemetry, HuggingFace Hub auto-downloads | Must be permanently suppressed via offline environment flags. |

### Mandatory Telemetry Suppression Environment Variables:
```bash
export DO_NOT_TRACK=1
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export PADDLE_PDX_DISABLE_REPORT=1
export OLLAMA_NOPRUNE=1
export TOKENIZERS_PARALLELISM=false
```

---

## 11. Locked Pinned Version Inventory

### 11.1. Python Backend Dependencies (`requirements.txt`)
```txt
# Core Framework & Server
fastapi==0.111.0
uvicorn[standard]==0.30.1
pydantic==2.7.4
pydantic-settings==2.3.4
python-multipart==0.0.9
websockets==12.0
pyyaml==6.0.1

# Agent Orchestration & LLM Interface
langchain==0.2.11
langchain-core==0.2.23
langchain-community==0.2.10
httpx==0.27.0

# Vector Database & Embeddings
chromadb==0.5.4
sentence-transformers==3.0.1
torch==2.3.1+cu121 --extra-index-url https://download.pytorch.org/whl/cu121

# Local Document Parsing & OCR
pypdf==4.3.1
pdfplumber==0.11.2
paddlepaddle-gpu==2.6.1; sys_platform == 'linux'
paddleocr==2.8.1
pytesseract==0.3.10
Pillow==10.4.0

# Enterprise Office Deliverable Generation
python-docx==1.1.2
openpyxl==3.1.5
python-pptx==0.6.23

# Sandbox & Hardware Telemetry
docker==7.1.0
pynvml==11.5.0
psutil==6.0.0
scapy==2.5.0

# Testing Suite
pytest==8.2.2
pytest-asyncio==0.23.8
pytest-cov==5.0.0
```

### 11.2. Frontend Dependencies (`package.json`)
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

---

## 12. Conflicts Cross-Check & Alignment Resolution

We have cross-checked this document against [docs/architecture.md](file:///G:/SIH/p/docs/architecture.md), [docs/model_registry.yaml](file:///G:/SIH/p/docs/model_registry.yaml), [docs/agent_capabilities.md](file:///G:/SIH/p/docs/agent_capabilities.md), and [docs/ui_design.md](file:///G:/SIH/p/docs/ui_design.md).

| Item Checked | Document Reference | `tech_stack.md` Specification | Status | Resolution / Alignment |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | `architecture.md` (React) vs `tech_stack.md` (Next.js) | Next.js 14.2.5 with `output: 'export'` (pure static export). | **Reconciled** | Next.js App Router with static export outputs static assets served by FastAPI; no Node SSR runtime needed. |
| **Model Registry Filename** | `docs/model_registry.yaml` vs `models.yaml` in user prompt | Standardized to **`models.yaml`** as the active runtime configuration file. | **Reconciled** | The runtime loader will load `models.yaml` at root or in `backend/config/models.yaml`, and `docs/model_registry.yaml` remains the documentation reference. |
| **Model List & Quantization** | `architecture.md` & `model_registry.yaml` | Exactly `Qwen 3 4B`, `Qwen 2.5 Coder 3B`, `Qwen2-VL 2B`, `Llama 3.2 3B` (all GGUF Q4_K_M). | **100% Match** | Perfect parity across all documents. |
| **VRAM Budget Breakdown** | `architecture.md` | OS: 0.5 GB, Qwen3: 2.8 GB, Secondary: 2.0 GB, KV Cache: 0.7 GB = 5.5 GB total. | **100% Match** | Perfect parity. |
| **Packet Sniffer Choice** | `architecture.md` (Scapy / Pyshark) | Selected **`scapy`** as primary pure-Python sniffer to avoid requiring external `tshark.exe` installations. | **Reconciled** | Marked for final confirmation with user. |
| **State Management** | `ui_design.md` | Selected **`Zustand`** exclusively for React state. | **100% Match** | No multi-library state conflicts. |
| **Dev-Time vs Runtime Tooling** | `agent_capabilities.md` | Dev-time assistant tools (`context7`, `search_web`, `github`) permitted for coding only; deployed app is 100% local. | **100% Match** | Strict adherence to the Dev-Time policy. |

---

## 13. Items Awaiting User Confirmation (`TODO: confirm`)

1. **Environment Manager:** Confirm `venv` (recommended for lightweight local single-laptop run) vs. `poetry`.
2. **Embeddings Library:** Confirm `sentence-transformers` vs. `FlagEmbedding` for local `BAAI/bge-small-en-v1.5` inference.
3. **Packet Sniffing Library:** Confirm `scapy` (pure Python, self-contained) vs. `pyshark` (requires system Wireshark/tshark).
