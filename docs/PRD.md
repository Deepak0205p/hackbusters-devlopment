# Product Requirements Document (PRD)
## Sovereign On-Premise Agentic AI Workbench Using Open-Weight Multimodal LLMs for Confidential Industrial Work

- **Problem Statement ID:** SIH26117
- **Target Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)
- **Nodal Ministry:** Ministry of Petroleum & Natural Gas (MoPNG)
- **Theme & Category:** Smart Automation | Software Edition

---

## 1. Executive Summary & Vision
The Sovereign On-Premise Agentic AI Workbench is a 100% self-hosted, air-gapped, multimodal AI platform designed for confidential industrial operations at MRPL. Because sensitive refinery assets (P&IDs, inspection records, financial bids, turnaround schedules) cannot be uploaded to commercial public cloud LLMs, this platform orchestrates open-weight quantized models on a single local GPU workstation (NVIDIA RTX 3050 6GB / RTX 4060 8GB) with provable zero external data egress.

---

## 2. The 12 Mandatory MRPL Requirements (Exact Restatement)

| S. No. | Requirement | Source Description |
| :--- | :--- | :--- |
| **01** | **SELF-HOSTED & AIR-GAPPED** | The entire AI platform must operate on-premises on the organization's dedicated GPU hardware without any dependency on external cloud services. |
| **02** | **ZERO EXTERNAL EGRESS** | Absolute network boundary enforcement where zero packets, telemetry data, or API calls ever leave the local premises. |
| **03** | **SIMULTANEOUS MULTI-MODEL SUPPORT** | Backend model server must support multiple specialized open-weight models concurrently in local storage and VRAM. |
| **04** | **INTELLIGENT AUTO-SELECTION** | System must automatically classify incoming tasks (coding, reasoning, vision, general) and route them to the optimal specialized model. |
| **05** | **EXTENSIBLE MODEL REGISTRY** | New open-weight models must be easily addable via configuration files without requiring architectural redesign or code refactoring. |
| **06** | **AGENTIC PLANNING & TOOL CALLING** | Autonomous agent engine must plan multi-step workflows and execute local tools (file I/O, sandboxed code execution, document search). |
| **07** | **ITERATIVE SELF-CORRECTION LOOP** | The agent must inspect its own execution outputs, validate quality, and iteratively correct errors (up to 10 iterations) instead of single-pass failure. |
| **08** | **MULTIMODAL INPUT PROCESSING** | Native support for processing scanned PDF inspection reports, handwritten field notes, complex engineering diagrams, and photos. |
| **09** | **ON-DEVICE OCR & VISION** | Integration of high-precision local OCR engines (PaddleOCR/Tesseract) coupled with on-device vision-language models. |
| **10** | **PRODUCTION DELIVERABLE GENERATION** | Direct automated generation of fully structured, editable enterprise artifacts including Word (.docx), Excel (.xlsx), PPT (.pptx), and Python code. |
| **11** | **GROUNDED LOCAL KNOWLEDGE BASE** | Retrieval-Augmented Generation (RAG) using local vector embeddings grounded in refinery SOPs, equipment manuals, and past correspondence. |
| **12** | **PROVABLE SOVEREIGNTY AUDITING** | Real-time, verifiable network traffic monitoring and socket sniffing proving that zero outbound external calls occur during task execution. |

---

## 3. Requirement to Module Mapping & Verification Evidence

| Req ID | Requirement Name | Implemented System Module | Verification & Live Demo Evidence |
| :--- | :--- | :--- | :--- |
| **01** | Self-Hosted & Air-Gapped | Local Ollama + FastAPI Backend (`127.0.0.1`) + Local React Web UI | Browser access exclusively at `http://localhost:{port}`; zero external API tokens configured. |
| **02** | Zero External Egress | Network Watchdog & Boundary Enforcement (`psutil`, `scapy` / `pyshark`) | Real-time Sovereignty Audit log showing 0 external packets and 0 outbound WAN sockets. |
| **03** | Simultaneous Multi-Model Support | Dynamic VRAM Swapping / LRU Paging Manager | `nvidia-smi` live telemetric output showing active VRAM allocation within ~4.6GB / 6.0GB. |
| **04** | Intelligent Auto-Selection | Two-Stage Intent Router (Regex/Keyword Rules + BGE Semantic Matcher) | Automated model dispatch: Coding $\rightarrow$ Coder 3B, Reasoning $\rightarrow$ Qwen3 4B, Vision $\rightarrow$ Qwen2-VL 2B. |
| **05** | Extensible Model Registry | Declarative YAML Registry (`model_registry.yaml`) + Dynamic Loader | Editing `model_registry.yaml` adds a new model into the UI catalog dynamically without backend restart. |
| **06** | Agentic Planning & Tool Calling | LangChain ReAct Autonomous Agent Loop | UI step-by-step trace showing Thought $\rightarrow$ Action $\rightarrow$ Observation cycle with local tool executions. |
| **07** | Iterative Self-Correction | Agent Loop with Error Feedback (Max 10 Retries) | Code execution exception captured from Docker sandbox, parsed by agent, corrected, and re-executed. |
| **08** | Multimodal Input Processing | Multimodal Ingestion Pipeline (PDF, PNG, JPG, TIFF) | Scanned refinery inspection reports and P&ID diagrams uploaded and processed directly. |
| **09** | On-Device OCR & Vision | Local PaddleOCR / Tesseract Engine + Qwen2-VL 2B Multimodal VLM | Scanned text, equipment tags, table structures, and visual diagrams extracted locally. |
| **10** | Production Deliverables | Native Enterprise File Generators (`python-docx`, `openpyxl`, `python-pptx`) | Direct generation and browser download of formatted `.docx`, `.xlsx`, `.pptx`, and `.py` files. |
| **11** | Grounded Local RAG | ChromaDB Vector Store + `BAAI/bge-small-en-v1.5` Local Embeddings | Retrieval queries citing authentic MRPL SOP clauses, manual sections, and page references. |
| **12** | Provable Sovereignty Auditing | Sovereignty Daemon & Real-time Network Dashboard | Exportable JSON/CSV audit log confirming Total External Packets = 0 during full agent lifecycle. |

---

## 4. Evaluation Demo Scenarios (SIH Target Deliverables)

1. **Scenario 1: Scanned Refinery Inspection Report $\rightarrow$ Executive Word Approval Note**
   - Ingests scanned furnace inspection PDF.
   - Extracts tube skin temperatures, corrosion rates, and decoking requirements using PaddleOCR + Qwen2-VL 2B.
   - Cross-references MRPL safety SOPs via ChromaDB RAG.
   - Generates formatted `approval_note.docx` via Qwen3 4B.
   - Network monitor logs verify 0 outbound external packets throughout execution.

2. **Scenario 2: Centrifugal Pump Calculation $\rightarrow$ Sandboxed Docker Python Execution**
   - User requests hydraulic efficiency & brake horsepower calculation.
   - Router detects coding intent and invokes Qwen 2.5 Coder 3B.
   - Code is executed inside an isolated, non-networked Docker container.
   - Agent validates execution stdout; if errors occur, self-corrects up to 10 iterations.
   - Structured numerical results and standalone `.py` script returned.

3. **Scenario 3: Scanned P&ID Engineering Drawing $\rightarrow$ Excel Asset Register**
   - Ingests scanned P&ID drawing.
   - Qwen2-VL identifies valves, pumps, and transmitters.
   - Cross-references equipment tags with ChromaDB asset records.
   - Outputs structured, styled `asset_register.xlsx` with maintenance flags using `openpyxl`.

4. **Scenario 4: Real-Time Network & Sovereignty Compliance Audit**
   - Real-time packet sniffer and socket auditor monitors all interfaces.
   - Displays all local inter-process communications (FastAPI $\leftrightarrow$ Ollama $\leftrightarrow$ ChromaDB $\leftrightarrow$ Docker).
   - Verifies 0 outbound external packets, 0 DNS queries, and 0 external cloud connections with tamper-evident audit logs.

---

## 5. Explicit Out-of-Scope Items

1. **Public Cloud AI APIs:** No integrations with OpenAI, Anthropic, Google Gemini, Azure OpenAI, or AWS Bedrock.
2. **External Cloud Telemetry / Webhook Egress:** No cloud error tracking (Sentry SaaS, Datadog Cloud, PostHog Cloud, etc.) or external analytics.
3. **Multi-Node Distributed Clusters in Tier 1:** Distributed training and multi-node Ray/vLLM clustering are roadmap items (Tier 3/4) and out-of-scope for the single 6GB GPU workstation implementation.
4. **Internet Dependency for RAG / Live Web Search:** No live external internet search tools (Google/Bing/Tavily); all vector retrieval is confined to local ChromaDB indexed documents.
5. **Proprietary Licensed Software Dependencies:** No proprietary cloud OCR or paid office converter APIs; all OCR and deliverable generators use open-source local libraries.

---

## 6. Open Items & Ambiguities
- `TODO: confirm`: Exact list of sample MRPL SOP documents and historical correspondence files to pre-seed in local ChromaDB for testing.
- `TODO: confirm`: User authentication model (Local Single-User Session vs. Multi-User Local RBAC) for on-premise refinery workstations.
- `TODO: confirm`: Preferred fallback local OCR engine priority if GPU acceleration is constrained (PaddleOCR GPU vs. Tesseract CPU).
