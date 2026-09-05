# REVEAL 2.0: MRPL Sovereign AI Workbench (SIH26117)

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-000000.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-24.0+-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-black.svg?style=flat&logo=ollama&logoColor=white)](https://ollama.com/)
[![Security](https://img.shields.io/badge/Security-ISA%2FIEC%2062443%20Ready-blue.svg?style=flat)]()
[![Compliance](https://img.shields.io/badge/Compliance-100%25%20Air--Gapped%20Sovereign-success.svg?style=flat)]()

**REVEAL 2.0** is an enterprise defense-grade, **100% air-gapped on-premise agentic AI workbench** engineered for industrial operations at **Mangalore Refinery and Petrochemicals Limited (MRPL — ONGC Group Company)**.

Operating in complete cryptographic isolation with **zero WAN internet egress**, REVEAL 2.0 combines SmartCard PKI authentication, Corporate Active Directory / LDAP integration, multi-model GPU VRAM orchestration ($\le 6.0\text{ GB}$), two-stage query routing, offline RAG over refinery SOPs, automated multi-format deliverable synthesis (Word, Excel, PowerPoint), and isolated Docker code execution.

---

## 🌐 Port Allocation & Service Map

| Service | Port | Local URL | Role / Description |
| :--- | :--- | :--- | :--- |
| **Public Chat & Canvas UI** | `3000` | [`http://localhost:3000/`](http://localhost:3000/) | Executive Chat UI, Document Canvas (UniverJS / Monaco), and Deliverable Explorer |
| **Admin Observatory UI** | `3001` | [`http://localhost:3001/`](http://localhost:3001/) | Real-time System Observatory, VRAM telemetry, RAG manager, and Audit Watchdog |
| **Python Backend Gateway** | `8000` | [`http://localhost:8000/`](http://localhost:8000/) | FastAPI Application, ReAct Agent loop, ChromaDB RAG, and WebSocket streams |
| **Local LLM Daemon** | `11434` | [`http://localhost:11434/`](http://localhost:11434/) | Local Ollama / GGUF model serving engine |

---

## 📑 Table of Contents
1. [Core Features & Architecture](#-core-features--architecture)
2. [Enterprise Security & PKI Authentication](#-enterprise-security--pki-authentication)
3. [Complete Tech Stack](#-complete-tech-stack)
4. [Directory & Repository Structure](#-directory--repository-structure)
5. [Subsystems Deep Dive](#-subsystems-deep-dive)
6. [Prerequisites](#-prerequisites)
7. [Step-by-Step Setup & Running Locally](#-step-by-step-setup--running-locally)
8. [Demo / Fast-Track Evaluation Guide](#-demo--fast-track-evaluation-guide)
9. [Developer Standards & Air-Gap Invariants](#-developer-standards--air-gap-invariants)

---

## 🏛 Core Features & Architecture

```mermaid
graph TD
    User["👤 Refinery Operator / Engineer"] -->|Port 3000| ChatUI["🎨 Public Chat & Canvas UI (apps/chat-frontend)"]
    Admin["🛡 Security Officer / CISO / Jury"] -->|Port 3001| AdminUI["📊 Admin Observatory UI (apps/admin-frontend)"]
    
    ChatUI -->|Chat, Upload, OCR, Sandbox :8000| UserBackend["⚡ User Gateway (apps/user_backend)"]
    AdminUI -->|Models, RAG Admin, Sovereignty, Auth :8000| AdminBackend["🛡 Admin Gateway (apps/admin_backend)"]
    
    subgraph Shared_Core ["🧠 Sovereign Core & Intelligence Enclave (apps/shared)"]
        Router["Two-Stage Query Router (<2ms Regex + <25ms Semantic)"]
        ReAct["LangChain ReAct Reasoning Loop & Tools"]
        VRAMMgr["Dynamic Dual-Slot LRU VRAM Manager (<6GB)"]
        RAG["ChromaDB Sovereign RAG (BAAI/bge-small-en-v1.5)"]
        OCR["Multimodal OCR & ISA 5.1 P&ID Graph Extractor"]
        OfficeGen["Office Document Synthesizer (.docx, .xlsx, .pptx)"]
        DockerSandbox["Isolated Docker Execution Sandbox (--network none)"]
        SocketWatchdog["psutil Network Egress Watchdog (WAN = 0B)"]
        TamperLedger["SHA-256 Tamper-Evident Blockchain Ledger"]
        MySQL_DB[("🗄 XAMPP MySQL Database (mrpl_reveal_auth)")]
    end
    
    UserBackend --> Shared_Core
    AdminBackend --> Shared_Core
    Shared_Core --> Ollama["Local LLM Daemon (:11434)"]
```

### 🌟 High-Level Architectural Pillars

1. **Decoupled Gateway Layer (`apps/user_backend` & `apps/admin_backend`)**:
   - Dedicated User Gateway for low-latency streaming chat, OCR extraction, file downloads, and sandbox execution.
   - Dedicated Admin Observatory Gateway for telemetry monitoring, VRAM swapping, PKI X.509 auth, and RAG administrative indexing.

2. **Shared Sovereign Core Enclave (`apps/shared`)**:
   - Centralized ReAct reasoning engine, model orchestration, and sovereign RAG pipeline shared across gateways with zero code duplication.

3. **Multi-Model GPU VRAM Orchestrator ($\le 6.0\text{ GB}$ VRAM)**:
   - Dynamic Dual-Slot LRU Memory Manager enabling multiple specialized local LLMs (General Agent, Math/Code, Safety RAG, Vision) on standard refinery laptops and edge workstations.

4. **Two-Stage Ultra-Fast Query Router**:
   - **Stage 1 (<2ms)**: Regex-based classification for immediate formulas, unit conversions, and direct report generation.
   - **Stage 2 (<25ms)**: Semantic vector routing directing specialized queries to Domain RAG, Isolated Docker Sandbox, or Direct Synthesis.

5. **Multi-Format Industrial Deliverable Generator**:
   - Automated programmatic synthesis of defense-grade Word reports (`.docx`), Excel calculation workbooks (`.xlsx`), and executive slide presentations (`.pptx`).

6. **Interactive In-Browser Document Canvas Panel**:
   - Real-time in-browser workspace powered by **UniverJS** (Sheets, Docs, Slides) and **Monaco Editor** for inspecting and editing synthesized artifacts with live formula computation.

7. **Multimodal OCR & ISA 5.1 P&ID Graph Extraction**:
   - Offline parsing of complex engineering schematics and piping drawings, detecting ISA 5.1 tags (`FT-101`, `PT-202`, `XV-301`) and building interactive topological connection graphs.

8. **100% Air-Gapped Egress Watchdog & Blockchain Audit Ledger**:
   - Real-time `psutil` network socket monitor guaranteeing $0\text{ B}$ WAN egress and SHA-256 cryptographic hash-chained audit persistence in **XAMPP MySQL**.

---

## 🔐 Enterprise Security & PKI Authentication

REVEAL 2.0 incorporates defense-grade authentication meeting **ISA/IEC 62443** critical infrastructure cybersecurity standards:

1. **Hardware SmartCard PKI (X.509 / mTLS)**:
   - Cryptographic verification against the sovereign **MRPL Plant Root CA**.
   - Real-time CRL (Certificate Revocation List) checking with immediate serial revocation.
   - Built-in `.pem`/`.crt` file upload, interactive card reader simulation, and valid test presets.
2. **Corporate Active Directory / Intranet LDAP**:
   - Secure directory binding with domain mapping (`MRPL.INTERNAL`, `ONGC.CORP`, `REFINERY-WEST.LOCAL`).
   - Automatic `memberOf` group deduction mapping to industrial roles.
3. **6-Tier Industrial Role-Based Access Control (RBAC)**:
   - `SUPER_ADMIN` (Executive HSE, Plant CISO, Full Override)
   - `PLANT_SECURITY_OFFICER` (CRL Management, Tamper Audit, User Governance)
   - `PROCESS_LEAD` (Production Planning, AST Sandbox Override, RAG Ingestion)
   - `MAINTENANCE_ENG` (Equipment P&ID Extraction, Work Order Synthesis)
   - `HSE_AUDITOR` (Safety Compliance, Regulatory Incident Review)
   - `FIELD_OPERATOR` (Real-time Operations, SOP Queries, Incident Logging)
4. **SHA-256 Tamper-Evident Audit Ledger**:
   - Every login event, permission verification, model invocation, and CRL update is appended to a cryptographic hash-chained audit log persisted to XAMPP MySQL.
5. **Enterprise Defense Middleware**:
   - In-memory sliding-window rate limiting on all authentication and query endpoints.
   - Strict path traversal regex filtering (`../`, `..\`) and 50MB request size boundaries.
   - NIST & OWASP recommended HTTP hardening headers (`X-Frame-Options: DENY`, `nosniff`, `HSTS`, `Permissions-Policy`).

---

## 🛠 Complete Tech Stack

| Domain | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **User Gateway** | **Python / FastAPI** | `3.11+` / `0.111.0` | Chat, document upload, OCR & Docker sandbox gateway |
| **Admin Gateway** | **Python / FastAPI** | `3.11+` / `0.111.0` | System telemetry, VRAM manager, RAG admin & RBAC API |
| **ASGI Server** | **Uvicorn** | `0.30.1` | High-throughput asynchronous server on `0.0.0.0:8000` |
| **Database Layer** | **XAMPP MySQL / PyMySQL** | `8.0+` / `1.1.1` | On-premise relational store for users, RBAC, chat sessions, response cache & CRLs |
| **Security Layer** | **Argon2id / OWASP Middleware** | `23.8.0` / Custom | Memory-hard password hashing, sliding-window rate limiting & security headers |
| **Agent Framework** | **LangChain** | `0.2.11` | Strict ReAct reasoning loop with tool execution |
| **Model Runtime** | **Ollama / GGUF** | Latest | Local GPU model serving with dynamic LRU dual-slot swapping |
| **Vector Store** | **ChromaDB** | `0.5.4` | On-premise vector store with source citation attribution |
| **Embeddings** | **Sentence-Transformers** | `3.0.1` | Local `BAAI/bge-small-en-v1.5` embeddings (384-dimensional) |
| **OCR & Vision** | **PaddleOCR / Tesseract** | `2.8.1` / `5.3+` | Multimodal schematic extraction & ISA 5.1 P&ID parsing |
| **Office Automation**| **python-docx / openpyxl / pptx**| `1.1.2` / `3.1.5` / `0.6.23` | Programmatic generation of Word, Excel, and PowerPoint files |
| **Execution Sandbox**| **Docker Engine** | `24.0+` | `python:3.11-slim` container runner with `--network none` |
| **Sovereignty Daemon**| **psutil / Cryptography** | `6.0.0` / `42.0+` | Real-time socket watchdog & X.509 PKI validator |
| **Chat Frontend** | **Next.js 14 / React 18** | `14.2.5` / `18.3.1` | Main conversational interface + UniverJS Document Canvas |
| **Admin Frontend** | **Next.js 14 / React 18** | `14.2.5` / `18.3.1` | 9-Subsystem telemetry observatory dashboard |
| **Styling & UI** | **Tailwind CSS / Lucide** | `3.4.4` / `0.395.0` | Industrial dark aesthetic with "Double-Bezel" hardware chassis |
| **State Management** | **Zustand** | `4.5.4` | High-performance reactive stores for chat, theme, and telemetry |

---

## 📂 Directory & Repository Structure

```text
G:/SIH/p/
├── .gitignore                          # Excludes build caches, logs, node_modules, and models
├── README.md                           # Master documentation & deployment guide
├── package.json                        # Root repository metadata & Prisma scripts
│
├── apps/                               # Application Core & Microservices
│   ├── chat-frontend/                  # Public Chat Interface & Document Canvas (Port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── login/              # Redesigned Enterprise SmartCard/LDAP Login UI
│   │   │   │   ├── page.tsx            # Main Chat Engine with Perplexity-style reasoning
│   │   │   │   └── globals.css         # Industrial mesh grids & hardware chassis styles
│   │   │   ├── components/
│   │   │   │   ├── canvas/             # UniverJS Sheets, Slides, Docs & Monaco Editor
│   │   │   │   ├── sidebar/            # App sidebar with operator profile & session list
│   │   │   │   └── MarkdownContent.tsx # GFM renderer with syntax highlighting & tables
│   │   │   └── store/                  # Zustand state stores (Chat, Auth with 45-min idle auto-lock, Canvas, Theme)
│   │   ├── package.json                # Next.js scripts ("dev:http": "next dev -p 3000")
│   │   └── server-https.js             # Optional HTTPS server for mobile microphone access
│   │
│   ├── admin-frontend/                 # Admin Observatory Dashboard (Port 3001)
│   │   ├── src/
│   │   │   ├── app/                    # Multi-screen observatory pages (/models, /rag, /ocr, etc.)
│   │   │   ├── components/             # OverviewDeck, VRAM gauges, and Telemetry cards
│   │   │   └── store/                  # Admin stores (Models, Sovereignty, RAG, Network)
│   │   └── package.json                # Next.js scripts ("dev": "next dev -p 3001")
│   │
│   ├── user_backend/                   # User & Chat Backend Gateway (Port 8000)
│   │   ├── main.py                     # Entry point for chat, uploads, OCR & sandbox
│   │   ├── requirements.txt            # Python dependencies
│   │   └── api/                        # Route handlers (routes_chat, routes_upload, routes_files, routes_ocr, routes_sandbox)
│   │
│   ├── admin_backend/                  # Admin & Observatory Backend Gateway (Port 8000)
│   │   ├── main.py                     # Entry point for models, RAG, sovereignty & PKI auth
│   │   ├── requirements.txt            # Python dependencies
│   │   ├── api/                        # Route handlers (routes_auth, routes_models, routes_rag_admin, routes_sovereignty)
│   │   ├── core/                       # Enterprise auth manager, XAMPP MySQL backend & OWASP middleware
│   │   │   ├── auth_manager.py         # PyMySQL repository, Argon2id hasher & session manager
│   │   │   └── security_middleware.py  # Rate limiter, path sanitizers & security headers
│   │   └── config/                     # auth_config.yaml, hardware_profiles.yaml, models.yaml
│   │
│   └── shared/                         # Shared Sovereign Core Intelligence Enclave
│       ├── agent/                      # LangChain ReAct reasoning loop, tools & self-correction
│       ├── models/                     # Dual-slot LRU VRAM memory manager & compute backends
│       ├── rag/                        # ChromaDB vector store, BGE embeddings, grounding & MySQL response cache
│       ├── ocr/                        # PaddleOCR / Tesseract pipeline & P&ID graph extraction
│       ├── sandbox/                    # Docker container manager & AST screener
│       ├── sovereignty/                # Socket watchdog, air-gap classifier & SHA-256 tamper ledger
│       └── config/                     # Shared certificates, hardware profiles & models config
│
├── data/                               # Air-Gapped Persistent Storage
│   ├── chroma_db/                      # Embedded ChromaDB vector indices
│   ├── mrpl_documents/                 # Refinery SOPs, safety guidelines & CSB reports
│   ├── uploads/                        # User-uploaded documents and P&ID drawings
│   └── outputs/                        # Programmatically generated Word, Excel & PPTX files
│
└── scripts/                            # Operational & Setup Scripts
    └── download_and_verify_models.py   # Air-gap model verification script
```

---

## 🔍 Subsystems Deep Dive

### 1. Dual-Slot LRU VRAM Memory Manager
Allows hosting multiple specialized LLMs (General Agent, Math/Code, Safety RAG, Vision) on consumer workstations with **$\le 6.0\text{ GB}$ VRAM**:
* **Slot 1**: Fixed lightweight embeddings model (`BAAI/bge-small-en-v1.5`, ~130MB).
* **Slot 2**: Dynamic single-model execution slot with automated LRU unload/load cycles.

### 2. Two-Stage Query Router
* **Stage 1 (Regex Classifier, $<2\text{ms}$)**: Instant pattern matching for direct calculations, unit conversions, and standard deliverable requests.
* **Stage 2 (Semantic Vector Router, $<25\text{ms}$)**: High-accuracy intent categorization routing to Domain RAG, Code Sandbox, or Direct Synthesis.

### 3. In-Browser Document Canvas Panel
Provides live interactive editing and preview for synthesized outputs:
* **UniverJS Sheets**: Interactive spreadsheets with formula calculation and chart rendering.
* **UniverJS Docs & Slides**: Rich text document inspection and slide decks.
* **Monaco Code Editor**: Real-time syntax highlighting for generated Python/SQL scripts.

### 4. Multimodal OCR & P&ID Tag Extraction
* Offline extraction of text from scanned engineering drawings, PDF manuals, and P&ID piping diagrams.
* Detects ISA 5.1 instrumentation tags (`FT-101`, `PT-202`, `XV-301`) and builds an interactive topological connection graph.

---

## ⚡ Prerequisites

1. **Operating System:** Windows 10/11 (64-bit) or Ubuntu 22.04 LTS
2. **Database:** XAMPP MySQL running on `127.0.0.1:3306`
3. **Python:** Version `3.11.x` or `3.12.x`
4. **Node.js:** Version `18.x` or `20.x` (`node -v`)
5. **Ollama:** Installed and running locally ([ollama.com](https://ollama.com/))
6. **Docker Desktop:** (Optional) for sandboxed Python code execution

---

## 🚀 Step-by-Step Setup & Running Locally

### ⚡ Method 1: 1-Click Parallel Installation (Recommended for Windows)

We provide an automated multi-threaded parallel installer script: [`install_dependencies.bat`](file:///G:/SIH/p/install_dependencies.bat).

Double-click `install_dependencies.bat` or run in your terminal:
```cmd
install_dependencies.bat
```

**How it works:**
* Automatically checks for Python and Node.js/npm prerequisites.
* Spawns **4 concurrent worker processes** in parallel:
  1. **Worker 1 (Python Backend):** Upgrades pip and installs all unified backend dependencies (`requirements.txt`) including FastAPI, Uvicorn, ChromaDB, Sentence-Transformers, PyYAML, PyMySQL, etc.
  2. **Worker 2 (Chat Frontend):** Installs Next.js 14, UniverJS (Sheets, Docs, Slides), Monaco Editor, Tailwind CSS in [`apps/chat-frontend`](file:///G:/SIH/p/apps/chat-frontend).
  3. **Worker 3 (Admin Frontend):** Installs Next.js 14, Radix UI, Zustand, Tailwind CSS in [`apps/admin-frontend`](file:///G:/SIH/p/apps/admin-frontend).
  4. **Worker 4 (Root Tooling):** Installs root dependencies, Prisma CLI, and Playwright.
* Displays a **live terminal progress dashboard** monitoring the completion status of all 4 workers in real time.

---

### 🛠 Method 2: Manual Step-by-Step Installation

If you prefer installing dependencies manually or are running on Linux/macOS:

#### Step 1: Clone Repository
```bash
git clone https://github.com/Deepak0205p/hackbusters-devlopment.git
cd hackbusters-devlopment
```

#### Step 2: Install Python Backend Dependencies
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install unified requirements
python -m pip install -r requirements.txt
```

#### Step 3: Install Frontend Dependencies
```bash
# 1. Chat & Canvas Frontend
cd apps/chat-frontend
npm.cmd install        # On Linux/macOS: npm install
cd ../..

# 2. Admin Observatory Frontend
cd apps/admin-frontend
npm.cmd install        # On Linux/macOS: npm install
cd ../..

# 3. Root Workspace (Prisma & Tooling)
npm.cmd install        # On Linux/macOS: npm install
```

---

### 🦙 Step 3: Setup Local Ollama Model Daemon

Ensure Ollama is installed and running locally ([https://ollama.com/](https://ollama.com/)):
```bash
# Start Ollama service (if not already running in background)
ollama serve

# Pull required local LLMs (in a separate terminal)
ollama pull qwen2.5:7b
ollama pull deepseek-r1:7b
```

---

### 🗄 Step 4: Database Setup (XAMPP MySQL)

1. Start **Apache** and **MySQL** in your **XAMPP Control Panel**.
2. Create the database via phpMyAdmin or MySQL CLI (`127.0.0.1:3306`):
```sql
CREATE DATABASE IF NOT EXISTS mrpl_reveal_auth;
```
3. Generate Prisma client bindings (optional for DB sync):
```bash
npm.cmd run prisma:generate
```

---

### 🏃 Step 5: Launching the Platform

#### Option A: 1-Click Multi-Service Launcher (Windows)
Double-click or execute:
```cmd
start_services.bat
```
This automatically launches the **Python Backend Gateway** (Port 8000), **Chat Frontend** (Port 3000), and **Admin Observatory** (Port 3001) in separate synchronized windows.

#### Option B: Manual Individual Terminals

**Terminal 1 — Python Backend Gateway (Port 8000):**
```bash
# Windows PowerShell
$env:PYTHONPATH = "."
python -m uvicorn apps.user_backend.main:app --host 0.0.0.0 --port 8000 --reload

# Linux/macOS
PYTHONPATH=. python -m uvicorn apps.user_backend.main:app --host 0.0.0.0 --port 8000 --reload
```
👉 Backend API Docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

**Terminal 2 — Public Chat Frontend (Port 3000):**
```bash
cd apps/chat-frontend
npm.cmd run dev:http    # On Linux/macOS: npm run dev:http
```
👉 Public Chat UI: [http://localhost:3000](http://localhost:3000)

**Terminal 3 — Admin Observatory Frontend (Port 3001):**
```bash
cd apps/admin-frontend
npm.cmd run dev         # On Linux/macOS: npm run dev
```
👉 Admin Observatory UI: [http://localhost:3001](http://localhost:3001)

---

## 🎯 Demo / Fast-Track Evaluation Guide

When presenting to evaluators or juries, navigate to **`http://localhost:3000/login`**:

1. **Option A: SmartCard PKI (Recommended for Demo)**
   - Click the **SmartCard** tab.
   - Click **"Load Sample Card"** to auto-load a valid X.509 certificate signed by the MRPL Plant Root CA (`Rajesh Kumar - Executive HSE & Audit`).
   - Click **Authenticate via SmartCard PKI**.
2. **Option B: Corporate LDAP / Active Directory**
   - Click the **LDAP / AD** tab.
   - Click **"Fill Default User"** (`operator` / `RefineryPass2026!`).
   - Click **Sign in via Corporate LDAP**.
3. **Option C: 1-Click Fast-Track**
   - Click the **Fast-Track** tab.
   - Click **Lead Process Operator** (`FIELD_OP`) or **Refinery Compliance Chief** (`SUPER_ADMIN`) to sign in instantly.

---

## 🛡 Developer Standards & Air-Gap Invariants

1. **Zero External Telemetry Invariant:**
   - No runtime calls to OpenAI, Anthropic, Gemini, Azure, or remote analytics.
   - `HF_HUB_OFFLINE=1` and `CHROMA_TELEMETRY=False` are strictly enforced at startup.
2. **Port Separation Invariant:**
   - **Port 3000:** Public Chat & Canvas Interface
   - **Port 3001:** Admin Observatory Dashboard
   - **Port 8000:** FastAPI Intelligence Gateway
   - **Port 11434:** Ollama / Local Model Daemon
3. **Clean Git Hygiene:**
   - Exclude `.next/`, `node_modules/`, `*.tsbuildinfo`, `*.db-wal`, `__pycache__/`, and `.env` files.

---

**MRPL Sovereign AI Workbench — SIH26117**  
*Mangalore Refinery and Petrochemicals Limited (ONGC Group Company)*
