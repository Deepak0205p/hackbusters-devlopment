# Complete File Structure
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

`
G:/SIH/p/
├── .gitignore
├── README.md
├── AGENT.md                                # Operational & engineering rules
│
├── apps/                                   # Application Layer
│   ├── chat-frontend/                     # Standalone Public Gemini-Replica Chat UI (Next.js 14)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── store/
│   │   ├── out/                           # Static production export (Mounted at /)
│   │   └── package.json
│   │
│   ├── admin-frontend/                    # Operator & Jury 6-Screen Observatory (Next.js 14)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── store/
│   │   ├── out/                           # Static production export
│   │   └── package.json
│   │
│   └── admin_backend/                     # Unified 10-Module Python FastAPI Gateway (Port 8000)
│       ├── __init__.py
│       ├── main.py                        # Gateway entrypoint & static mount
│       ├── config/                        # Settings & model configurations
│       ├── models/                        # LRU Dual-Slot Manager & Compute Backends
│       ├── core/                          # Two-Stage Router & Stage 1/2 Rules
│       ├── sovereignty/                   # Socket Watchdog & SHA-256 Tamper Chain
│       ├── agent/                         # ReAct Engine & AST Code Sandbox
│       ├── ocr/                           # Multimodal PDF/P&ID Ingestion Pipeline
│       ├── rag/                           # ChromaDB SOP Vector Store & Embeddings
│       ├── deliverables/                  # Word/Excel/PPTX Generators
│       ├── api/                           # REST & WebSocket API Routers
│       └── tests/                         # Comprehensive 8-Module Regression Test Suite
│
├── docs/                                  # Project Planning & Architecture Specs
│   ├── PRD.md                             # Statutory requirements mapping
│   ├── architecture.md                    # System architecture & memory topology
│   ├── ARCHITECTURE_V2_SPLIT.md           # Dual-frontend split design & API contracts
│   ├── GEMINI_UI_REFERENCE.md             # Gemini web interface research & design tokens
│   ├── CHANGE_GUIDE.md                    # Living change guide & impact radius matrix
│   ├── file_structure.md                  # Complete directory & file structure
│   ├── DEMO_DAY_RUNBOOK.md                # Presenter script & live execution walkthrough
│   └── tasks.md                           # Implementation milestones & task tracker
│
└── data/                                  # Air-gapped persistent data storage
    ├── chromadb/                          # Embedded persistent vector database
    ├── sop_docs/                          # Refinery operational standards
    ├── sample_inputs/                     # Inspection logs & P&ID diagrams
    └── outputs/                           # Generated enterprise deliverables
`
