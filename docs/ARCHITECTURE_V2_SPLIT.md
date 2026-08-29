# Architecture V2: Dual-Frontend Split Specification
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

---

## 1. Executive Summary & Architectural Decision

To serve two distinct operational user roles with maximum clarity and zero functional compromise, the system is organized into **TWO separate Next.js web applications** backed by a **Single Unified FastAPI Gateway (Port 8000)**:

1. **PUBLIC CHAT APP (pps/chat-frontend):**
   - **Audience:** End-user refinery operators, plant managers, and demo day evaluators.
   - **UI Experience:** A clean, faithful interaction replica of gemini.google.com (Collapsible sidebar, elevated input pill, hero starter cards, clean markdown, collapsible 'Show thought process' accordions).
   - **API Surface:** Consumes only 4 endpoints (/api/chat/stream, /api/chat/message, /api/chat/upload, /api/files/download/*).

2. **ADMIN OBSERVABILITY DASHBOARD (pps/admin-frontend):**
   - **Audience:** System administrators, cybersecurity auditors, and technical jury members.
   - **UI Experience:** The comprehensive 6-screen system observatory (Model Status, Sovereignty Watchdog, Multimodal OCR, Deliverables, Sandbox Terminal, Multi-Device Hotspot).
   - **API Surface:** Consumes the complete 10-module backend API suite.

---

## 2. Backend Architecture Decision: Shared FastAPI vs Split Backends

| Architecture Model | Hardware VRAM & State Management | Port & Deployment Topology | Air-Gap Audit Log | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Two Separate Python Backend Processes** (e.g. Chat on 8001, Admin on 8000) | ❌ **High Risk:** Race conditions on 6GB VRAM locks; double memory overhead; desynchronized LRU states. | ❌ Two separate server processes to launch and monitor during live demo. | ❌ Two disconnected hash chains, complicating zero-egress defense. | **REJECTED** |
| **Option B: Single Shared FastAPI Gateway on Port 8000** (Mounted Static Apps + Prefixed Routes) | ✅ **100% Reliable:** Single authoritative Dual-Slot LRU model manager in GPU memory. | ✅ Single unified gateway on port 8000. Chat serves at / and Admin serves at /admin. | ✅ Unified, tamper-evident SHA-256 blockchain audit chain. | **RECOMMENDED & IMPLEMENTED** |

---

## 3. Directory Layout & Relocation Map

`
G:/SIH/p/
├── apps/
│   ├── chat-frontend/            # [Next Step] Public Gemini-replica chat application
│   │   ├── src/
│   │   │   ├── app/ (layout.tsx, page.tsx)
│   │   │   ├── components/ (sidebar, chat, dock, empty-state)
│   │   │   └── store/ (usePublicChatStore.ts)
│   │   └── package.json
│   │
│   ├── admin-frontend/           # [RELOCATED] Operator 6-Screen Observatory
│   │   ├── src/
│   │   │   ├── app/ (layout.tsx, page.tsx)
│   │   │   ├── components/ (models, sovereignty, ocr, deliverables, sandbox, lan)
│   │   │   └── store/ (useChatStore, useModelStore, etc.)
│   │   ├── out/                  # Static export bundle mounted to gateway
│   │   └── package.json
│   │
│   └── admin_backend/            # [RELOCATED] Complete 10-Module Python Gateway
│       ├── main.py               # FastAPI entrypoint (Port 8000)
│       ├── config/               # Settings & models.yaml parser
│       ├── models/               # LRU Model Manager & Compute Backends
│       ├── core/                 # Two-Stage Router & Dispatch
│       ├── sovereignty/          # Socket Sniffer & Tamper Log
│       ├── agent/                # ReAct Engine & AST Sandbox
│       ├── ocr/                  # Multimodal Ingestion Pipeline
│       ├── rag/                  # ChromaDB SOP Vector Store
│       ├── deliverables/         # Document Generators
│       ├── api/                  # REST & WebSocket API Routers
│       └── tests/                # 8/8 Fully passing regression suite
│
├── docs/                         # Specifications & Runbooks
│   ├── GEMINI_UI_REFERENCE.md
│   ├── ARCHITECTURE_V2_SPLIT.md
│   ├── file_structure.md
│   ├── CHANGE_GUIDE.md
│   └── DEMO_DAY_RUNBOOK.md
└── data/                         # Persistent ChromaDB, SOPs, Outputs
`

---

## 4. Minimal Public Chat API Surface

The Public Chat App communicates over the following minimal surface:
- **WS /api/chat/stream**: Bi-directional streaming for prompt execution, real-time thought events, and final answers.
- **POST /api/chat/message**: Synchronous JSON completion endpoint.
- **POST /api/upload**: Multimodal PDF/Image ingestion endpoint.
- **GET /api/files/download/{filename}**: Secure deliverable file download endpoint.
