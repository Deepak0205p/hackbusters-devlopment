# Living Change Guide & Impact Radius Matrix
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

This document is the binding architectural reference for modifying, swapping, upgrading, or reconfiguring any component in this codebase. Whenever a change is requested, the developer or AI agent **MUST read this guide first**, analyze the full impact radius, formulate a structured mini-plan, and obtain confirmation before modifying any code.

---

## 1. Universal "Before Changing Anything" Decision Checklist

Before making ANY code or configuration change, verify and answer these 6 mandatory questions:

```markdown
[ ] 1. Hard Requirement Check: Does this change violate any statutory requirement in docs/PRD.md or sdih_26117.pdf?
      (If YES: STOP immediately and flag the conflict to the user. Do not proceed.)
[ ] 2. VRAM Budget Check: If model-related, does total active GPU allocation stay <= 5.5 GB (under the 6.0 GB ceiling)?
[ ] 3. Air-Gap & Zero-Cloud Check: Does this library or model introduce external internet calls, cloud APIs, or telemetry?
      (Must be 100% verifiable offline; offline flags HF_HUB_OFFLINE=1, DO_NOT_TRACK=1 must be preserved.)
[ ] 4. Test Suite Impact: Which specific test suites in tests/ or docs/plans/ need re-running after this change?
[ ] 5. Tech Stack Update: Does docs/tech_stack.md need version updates or conflict re-verification?
[ ] 6. Architecture & Registry Alignment: Do docs/architecture.md, docs/model_registry.yaml, or models.yaml need updating?
```

---

## 2. Models Layer Impact Matrix

### 2.1. Reasoning Model
- **1. Component Name:** Primary Reasoning & Planning Engine
- **2. Current Choice:** `Qwen 3 4B` (`GGUF Q4_K_M`, ~2.8 GB VRAM footprint)
- **3. Exact Files / Configs Referencing It:**
  - `models.yaml` (entry `qwen3-4b`, `ollama_model_tag: "qwen3:4b-q4_k_m"`, `is_primary: true`)
  - `docs/model_registry.yaml`
  - `docs/architecture.md` (VRAM budget table, section 2)
  - `docs/tech_stack.md` (Model serving layer table)
  - `apps/admin_backend/config/model_config.py` (default primary model ID)
  - `apps/admin_backend/core/router.py` (Stage 1 regex target & Stage 2 semantic target for `reasoning`)
  - `apps/admin_backend/core/stage1_rules.py` (reasoning rule dispatch)
  - `apps/admin_backend/core/semantic_router.py` (`DOMAIN_MODEL_MAP["reasoning"]`)
  - `apps/admin_backend/agent/prompts.py` (ReAct system prompt tuned for Qwen 3 reasoning tokens)
  - `apps/admin_backend/agent/agent_loop.py` (default fallback model)
  - `apps/admin_backend/core/resilient_dispatch.py` (emergency fallback model)
  - `apps/admin_backend/tools/handwritten_extractor.py` (normalization prompt model)
  - `tests/test_router_accuracy.py` (expected model assertion for reasoning prompts)
  - `docs/plans/08_models_yaml_schema.md`, `09_vram_budget_validation.md`, `10_model_swapping_lru.md`, `14_router_stage1_regex.md`, `15_router_stage2_semantic.md`, `18_langchain_react_agent.md`
- **4. Downstream Impact:**
  - If parameter size exceeds 4.5B or quantization is unoptimized, VRAM footprint will breach 2.8 GB, causing OOM when secondary coder/vision model is loaded.
  - ReAct prompt parsing formatting in `apps/admin_backend/agent/prompts.py` may require prompt engineering adjustments if token stop sequences (`Thought:`, `Action:`) differ.
- **5. Safe Change Procedure:**
  1. Verify replacement model footprint: $\text{VRAM} \le 2.8\text{ GB}$ (GGUF Q4_K_M).
  2. Pull new model into Ollama (`ollama pull <new_tag>`) and run validation script `apps/admin_backend/core/quant_validator.py`.
  3. Update `models.yaml` and `docs/model_registry.yaml`.
  4. Update `apps/admin_backend/core/semantic_router.py` and `apps/admin_backend/core/stage1_rules.py` with new model ID.
  5. Run `pytest tests/test_router.py` and `pytest tests/test_model_manager.py`.
  6. Execute Demo Scenario 1 (Furnace Inspection) to verify end-to-end SOP synthesis.
- **6. Invariants That Must Hold:**
  - Model must be 100% open-weight and locally servable via Ollama.
  - Model footprint + 2.0GB secondary model + 0.5GB OS + 0.7GB KV Cache $\le 5.5\text{ GB}$.
- **7. Rollback Plan:** Keep `qwen3:4b-q4_k_m` in Ollama inventory. If replacement model fails, restore `models.yaml` to `"qwen3-4b"` without restarting FastAPI.

---

### 2.2. Coding Model
- **1. Component Name:** Code Generation & Calculation Specialist
- **2. Current Choice:** `Qwen 2.5 Coder 3B` (`GGUF Q4_K_M`, ~2.0 GB VRAM footprint)
- **3. Exact Files / Configs Referencing It:**
  - `models.yaml` (entry `qwen2.5-coder-3b`, `ollama_model_tag: "qwen2.5-coder:3b-q4_k_m"`)
  - `docs/model_registry.yaml`
  - `docs/architecture.md` (VRAM table & swapping sequence)
  - `docs/tech_stack.md`
  - `apps/admin_backend/core/stage1_rules.py` (coding regex patterns)
  - `apps/admin_backend/core/semantic_router.py` (`DOMAIN_MODEL_MAP["coding"]`)
  - `apps/admin_backend/agent/self_correction.py` (coding traceback prompts)
  - `apps/admin_backend/tools/docker_sandbox.py` (execution capture)
  - `tests/test_router_accuracy.py`
  - `docs/plans/08_models_yaml_schema.md`, `14_router_stage1_regex.md`, `15_router_stage2_semantic.md`, `20_self_correction_loop.md`, `35_python_script_execution.md`, `36_traceback_feedback_loop.md`
- **4. Downstream Impact:**
  - Changes in generated Python code formatting (e.g. Markdown wrapping ` ```python ` vs raw text) affects `apps/admin_backend/tools/docker_sandbox.py` code extraction.
  - Accuracy on mathematical and hydraulic formulas directly affects Demo Scenario 2 pump efficiency calculation.
- **5. Safe Change Procedure:**
  1. Pull candidate model into Ollama and verify VRAM $\le 2.0\text{ GB}$.
  2. Update `models.yaml` and `docs/model_registry.yaml`.
  3. Update router mapping in `apps/admin_backend/core/semantic_router.py`.
  4. Run `pytest tests/test_docker_sandbox.py` and execute pump efficiency self-correction test.
- **6. Invariants That Must Hold:**
  - Must generate executable Python 3.11 scripts with standard library / numpy / scipy imports.
  - Must not exceed 2.0 GB VRAM footprint.
- **7. Rollback Plan:** Revert `models.yaml` entry to `qwen2.5-coder:3b-q4_k_m`.

---

### 2.3. Vision Model
- **1. Component Name:** Multimodal Vision & Diagram Specialist
- **2. Current Choice:** `Qwen2-VL 2B` (`GGUF Q4_K_M`, ~2.0 GB VRAM footprint)
- **3. Exact Files / Configs Referencing It:**
  - `models.yaml` (entry `qwen2-vl-2b`, `ollama_model_tag: "qwen2-vl:2b-q4_k_m"`)
  - `docs/model_registry.yaml`
  - `docs/architecture.md`
  - `docs/tech_stack.md`
  - `apps/admin_backend/rag/vision_pipeline.py` (multimodal image base64 prompt generator)
  - `apps/admin_backend/tools/pid_analyzer.py` (P&ID schematic analyzer)
  - `apps/admin_backend/core/stage1_rules.py` (attachment detection routing)
  - `apps/admin_backend/core/semantic_router.py` (`DOMAIN_MODEL_MAP["vision"]`)
  - `tests/test_router_accuracy.py`
  - `docs/plans/26_qwen2_vl_preprocessing.md`, `27_pid_drawing_analysis.md`
- **4. Downstream Impact:**
  - If the new vision model expects a different image payload format (e.g. raw filepath vs base64 vs multi-image array), `apps/admin_backend/rag/vision_pipeline.py` must be adapted.
  - VLM context size limits maximum downscaled image resolution.
- **5. Safe Change Procedure:**
  1. Check image input API specifications via `context7` for Ollama vision endpoints.
  2. Pull new vision model into Ollama; check VRAM allocation $\le 2.0\text{ GB}$.
  3. Update `models.yaml` and `apps/admin_backend/rag/vision_pipeline.py`.
  4. Run P&ID extraction test on `data/sample_inputs/engineering_pid_drawing.png`.
- **6. Invariants That Must Hold:**
  - Must accept multimodal image inputs alongside text prompts via local Ollama API.
  - VRAM footprint $\le 2.0\text{ GB}$.
- **7. Rollback Plan:** Revert `models.yaml` to `qwen2-vl:2b-q4_k_m`.

---

### 2.4. General Assistant Model
- **1. Component Name:** Conversational & General Query Model
- **2. Current Choice:** `Llama 3.2 3B` (`GGUF Q4_K_M`, ~2.0 GB VRAM footprint)
- **3. Exact Files / Configs Referencing It:**
  - `models.yaml` (entry `llama-3.2-3b`, `ollama_model_tag: "llama3.2:3b-q4_k_m"`)
  - `docs/model_registry.yaml`
  - `apps/admin_backend/config/model_config.py` (`default_general_model`)
  - `apps/admin_backend/core/stage1_rules.py` (general greeting patterns)
  - `apps/admin_backend/core/semantic_router.py` (`DOMAIN_MODEL_MAP["general"]`)
  - `tests/test_router_accuracy.py`
- **4. Downstream Impact:**
  - Serves as the fallback for conversational chit-chat, simple formatting, and general QA.
- **5. Safe Change Procedure:**
  1. Pull replacement model into Ollama.
  2. Update `models.yaml` and router domain map.
  3. Test with conversational prompts (`"Hello"`, `"What can you do?"`).
- **6. Invariants That Must Hold:**
  - VRAM footprint $\le 2.0\text{ GB}$.
- **7. Rollback Plan:** Revert `models.yaml` to `llama3.2:3b-q4_k_m`.

---

## 3. Core Libraries Impact Matrix

### 3.1. Web Framework (FastAPI)
- **1. Component Name:** REST & WebSocket Backend Gateway
- **2. Current Choice:** `FastAPI 0.111.0` + `Uvicorn 0.30.1` + `Pydantic 2.7.4`
- **3. Exact Files / Configs Referencing It:**
  - `requirements.txt`
  - `docs/tech_stack.md`
  - `apps/admin_apps/admin_backend/main.py`
  - `apps/admin_backend/api/*.py` (all route modules)
  - `tests/test_api_routes.py`
- **4. Downstream Impact:**
  - Any framework swap (e.g. to Litestar or Flask) requires rewriting all async route handlers, WebSocket managers, middleware, and Pydantic validation decorators.
- **5. Safe Change Procedure:**
  1. NEVER replace FastAPI unless requested; if minor version upgrade: verify Pydantic v2 compatibility.
  2. Run `pytest tests/test_api_routes.py`.
- **6. Invariants That Must Hold:**
  - Must bind to `0.0.0.0:8000` to support multi-device LAN/Hotspot access.
  - Must mount Next.js static export at `/` via `StaticFiles`.

---

### 3.2. Agent Orchestration (LangChain)
- **1. Component Name:** ReAct Agent Framework
- **2. Current Choice:** `LangChain 0.2.11` + `langchain-community 0.2.10` + `langchain-core 0.2.24`
- **3. Exact Files / Configs Referencing It:**
  - `requirements.txt`
  - `apps/admin_backend/agent/agent_loop.py`
  - `apps/admin_backend/agent/prompts.py`
  - `apps/admin_backend/agent/self_correction.py`
  - `apps/admin_backend/tools/base.py`
- **4. Downstream Impact:**
  - Upgrades across LangChain major versions break ReAct output parser interfaces and agent executors.
- **5. Safe Change Procedure:**
  1. Query `context7` for exact syntax of target LangChain version.
  2. Test ReAct loop with multi-step tool execution in `tests/test_agent_loop.py`.
- **6. Invariants That Must Hold:**
  - Max iterations must remain hard-capped at 10.
  - No cloud tracing/telemetry callbacks enabled (`LANGCHAIN_TRACING_V2=false`).

---

### 3.3. Vector Database (ChromaDB)
- **1. Component Name:** Local Persistent Vector Database
- **2. Current Choice:** `ChromaDB 0.5.4` (Embedded persistent SQLite mode)
- **3. Exact Files / Configs Referencing It:**
  - `requirements.txt`
  - `docs/tech_stack.md`
  - `apps/admin_backend/rag/vector_store.py`
  - `apps/admin_backend/rag/ingest.py`
  - `apps/admin_backend/rag/seed_database.py`
  - `apps/admin_backend/tools/rag_search_tool.py`
  - `data/chromadb/` (storage directory)
- **4. Downstream Impact:**
  - Swapping to another vector store (e.g. FAISS or Qdrant embedded) requires migrating all indexed SOP chunks in `data/chromadb/` and updating metadata filtering syntax.
- **5. Safe Change Procedure:**
  1. Ensure new engine runs 100% in-process on local disk with zero background daemon/port requirement.
  2. Implement `apps/admin_backend/rag/vector_store.py` adapter interface.
  3. Re-run `python -m backend.rag.seed_database` to re-populate collections.
  4. Run `pytest tests/test_rag_engine.py`.
- **6. Invariants That Must Hold:**
  - Zero external network calls (`anonymized_telemetry=False`).
  - Storage must persist on local disk (`data/chromadb/`).

---

### 3.4. Embedding Model
- **1. Component Name:** Dense Semantic Embedding Engine
- **2. Current Choice:** `BAAI/bge-small-en-v1.5` (via `sentence-transformers 3.0.1`, 384 dimensions)
- **3. Exact Files / Configs Referencing It:**
  - `requirements.txt`
  - `apps/admin_backend/rag/embeddings.py`
  - `apps/admin_backend/core/semantic_router.py`
  - `apps/admin_backend/rag/seed_database.py`
  - `data/models/bge-small-en-v1.5/`
- **4. Downstream Impact:**
  - **CRITICAL:** Changing embedding model alters vector dimensions (e.g. 384 $\rightarrow$ 768 or 1024). This **INVALIDATES ALL EXISTING CHROMADB COLLECTIONS** and **ROUTER CENTROIDS**.
- **5. Safe Change Procedure:**
  1. Check RAM and CPU inference latency of new model.
  2. Delete existing `data/chromadb/` collection directory.
  3. Update model name in `apps/admin_backend/rag/embeddings.py` and `apps/admin_backend/core/semantic_router.py`.
  4. Re-run `python -m backend.rag.seed_database` to re-embed all documents with new vectors.
  5. Re-run router benchmark `pytest tests/test_router_accuracy.py` to verify domain centroid accuracy.
- **6. Invariants That Must Hold:**
  - Must run completely offline on CPU with `HF_HUB_OFFLINE=1`.

---

### 3.5. OCR Engines (PaddleOCR & Tesseract)
- **1. Component Name:** Local Optical Character Recognition
- **2. Current Choice:** `PaddleOCR 2.8.1` (Primary, CPU mode) + `Tesseract 5.3+` / `pytesseract 0.3.10` (Fallback)
- **3. Exact Files / Configs Referencing It:**
  - `requirements.txt`
  - `apps/admin_backend/tools/ocr_tool.py`
  - `apps/admin_backend/tools/tesseract_tool.py`
  - `apps/admin_backend/tools/handwritten_extractor.py`
  - `apps/admin_backend/tools/pid_analyzer.py`
  - `apps/admin_backend/rag/vision_pipeline.py`
  - `data/models/paddleocr/`
- **4. Downstream Impact:**
  - OCR output structure changes (bounding box arrays vs raw strings) impact downstream P&ID tag extraction in `apps/admin_backend/tools/pid_analyzer.py`.
- **5. Safe Change Procedure:**
  1. Verify replacement OCR engine runs entirely offline on CPU.
  2. Update `apps/admin_backend/tools/ocr_tool.py`.
  3. Test on sample PDF inspection report (`data/sample_inputs/inspection_report_furnace.pdf`).
- **6. Invariants That Must Hold:**
  - Must run on CPU (`use_gpu=False`) to avoid consuming GPU VRAM needed for LLMs.
  - Telemetry reporting disabled (`PADDLE_PDX_DISABLE_REPORT=1`).

---

### 3.6. Office Deliverable Generators
- **1. Component Name:** Enterprise Document Generators
- **2. Current Choice:** `python-docx 1.1.2`, `openpyxl 3.1.5`, `python-pptx 0.6.23`
- **3. Exact Files / Configs Referencing It:**
  - `requirements.txt`
  - `apps/admin_backend/tools/docx_tool.py` (`data/outputs/docx/`)
  - `apps/admin_backend/tools/xlsx_tool.py` (`data/outputs/xlsx/`)
  - `apps/admin_backend/tools/pptx_tool.py` (`data/outputs/pptx/`)
  - `apps/admin_backend/api/routes_files.py` (download endpoints)
  - `tests/test_deliverables.py`
- **4. Downstream Impact:**
  - Changes to document formatting functions affect official MRPL approval note layouts and asset registers.
- **5. Safe Change Procedure:**
  1. Modify template builder functions in corresponding tool file.
  2. Generate test output file and verify file integrity in Microsoft Office / LibreOffice.
- **6. Invariants That Must Hold:**
  - Must output standard binary `.docx`, `.xlsx`, `.pptx` files without external cloud converter dependencies.

---

### 3.7. Frontend Framework & Styling
- **1. Component Name:** Next.js Static Web Application
- **2. Current Choice:** `Next.js 14.2.5` (App Router, `output: 'export'`) + `Tailwind CSS 3.4.4` + `Zustand 4.5.4`
- **3. Exact Files / Configs Referencing It:**
  - `apps/admin-frontend/package.json`
  - `apps/admin-frontend/next.config.mjs`
  - `apps/admin-frontend/src/app/*`
  - `apps/admin-frontend/src/components/*`
  - `apps/admin-frontend/src/store/*`
  - `apps/admin-frontend/src/lib/api.js` & `socket.js`
  - `apps/admin_apps/admin_backend/main.py` (mounting `apps/admin-frontend/out/`)
- **4. Downstream Impact:**
  - Introducing server-side features (API routes, SSR, server components requiring Node server) breaks static export and violates single-workstation air-gap architecture.
- **5. Safe Change Procedure:**
  1. Ensure all new UI components use `'use client'` where interactive.
  2. Run `npm run build` in `apps/admin-frontend/` to verify clean static export to `apps/admin-frontend/out/`.
  3. Verify FastAPI serves exported assets on `http://127.0.0.1:8000`.
- **6. Invariants That Must Hold:**
  - `output: 'export'` must remain active.
  - Zero external CDN links (fonts, scripts, icons must be bundled locally).

---

### 3.8. Network Monitoring Daemon
- **1. Component Name:** Sovereignty & Network Boundary Watchdog
- **2. Current Choice:** `psutil 6.0.0` (Socket auditor) + `scapy 2.5.0` (Packet sniffer)
- **3. Exact Files / Configs Referencing It:**
  - `requirements.txt`
  - `apps/admin_backend/core/socket_auditor.py`
  - `apps/admin_backend/core/packet_sniffer.py`
  - `apps/admin_backend/core/audit_logger.py`
  - `apps/admin_backend/api/routes_audit.py`
  - `apps/admin_backend/api/routes_websockets.py`
  - `tests/test_sovereignty_daemon.py`
- **4. Downstream Impact:**
  - Changes to packet sniff filters or socket classification regex can cause false positive breach alerts or miss external egress attempts.
- **5. Safe Change Procedure:**
  1. Test socket scanning across Localhost, LAN, and Hotspot modes.
  2. Run `pytest tests/test_sovereignty_daemon.py`.
- **6. Invariants That Must Hold:**
  - External WAN packet count must equal strictly 0.
  - Tamper-evident SHA-256 hash chaining must remain unbroken.

---

### 3.9. Docker Sandboxing Setup
- **1. Component Name:** Isolated Code Execution Sandbox
- **2. Current Choice:** Docker Engine 24.0+ (`sih-python-sandbox:3.11` image with `--network none`, 2 vCPU, 512MB RAM)
- **3. Exact Files / Configs Referencing It:**
  - `sandbox/Dockerfile`
  - `apps/admin_backend/tools/docker_sandbox.py`
  - `tests/test_docker_sandbox.py`
- **4. Downstream Impact:**
  - Altering Docker run flags (e.g. removing `--network none` or increasing memory beyond 512MB) compromises host stability and air-gap compliance.
- **5. Safe Change Procedure:**
  1. Edit `sandbox/Dockerfile` or `apps/admin_backend/tools/docker_sandbox.py`.
  2. Rebuild local image: `docker build -t sih-python-sandbox:3.11 sandbox/`.
  3. Run `pytest tests/test_docker_sandbox.py` to test memory limits and socket connection rejection.
- **6. Invariants That Must Hold:**
  - `--network none` must NEVER be removed or relaxed.

---

## 4. Infrastructure & Configuration Choices

### 4.1. Port Allocation Scheme
- **Current Allocation:**
  - FastAPI Gateway + Next.js Static UI: **Port `8000`** (Bound to `0.0.0.0`)
  - Ollama Model Server: **Port `11434`** (Bound strictly to `127.0.0.1`)
- **Impact of Change:** Changing port 8000 requires updating `apps/admin-frontend/src/lib/api.js`, `apps/admin-frontend/src/lib/socket.js`, `apps/admin_apps/admin_backend/main.py`, Windows Firewall inbound rules, and documentation.
- **Safe Procedure:** If port 8000 is occupied, update `PORT` environment variable and firewall rule; re-verify WebSocket connection URLs.

---

### 4.2. VRAM Budget Allocation Numbers
- **Current Allocation (6.0 GB physical ceiling):**
  - OS & Compositor: **0.5 GB**
  - Primary Model (Qwen 3 4B): **2.8 GB**
  - Secondary Model (Coder 3B / VL 2B): **2.0 GB**
  - KV Cache & Runtime: **0.7 GB**
  - Total Committed: **5.5 GB** (Leaves 0.5 GB safety margin)
- **Impact of Change:** Increasing primary model beyond 2.8 GB leaves insufficient room for secondary models, forcing full unloads on every turn.
- **Safe Procedure:** Recalculate full table in `docs/architecture.md` Section 2; verify peak memory via `pynvml`.

---

### 4.3. Model Swapping Timing Thresholds
- **Current Parameters:** Target latency $< 1.2\text{ seconds}$; `keep_alive: 5m` on load; `keep_alive: 0` on LRU eviction; max 2 concurrent models in GPU pool.
- **Impact of Change:** Increasing concurrent pool to 3 breaches 6GB VRAM; lowering `keep_alive` causes unnecessary reloading on multi-turn conversations.
- **Safe Procedure:** Test swapping sequence in `apps/admin_backend/core/model_manager.py`.

---

### 4.4. Self-Correction Max Iterations
- **Current Parameter:** Hard ceiling of **10 iterations**; 60-second total task timeout.
- **Impact of Change:** Decreasing below 5 may abort legitimate complex coding fixes; increasing beyond 10 risks runaway tool execution.
- **Safe Procedure:** Update `max_iterations` in `apps/admin_backend/agent/circuit_breaker.py` and `apps/admin_backend/agent/agent_loop.py`.

---

### 4.5. Deployment Modes (Standalone / LAN / Hotspot)
- **Current Modes:**
  - `STANDALONE_LOCAL` (`127.0.0.1:8000`)
  - `LAN_OPTION_A` (`<HOST_LAN_IP>:8000` via venue Wi-Fi router)
  - `HOTSPOT_OPTION_B` (`192.168.137.1:8000` via host Wi-Fi Hotspot with Internet Sharing OFF)
- **Impact of Change:** Changes to adapter detection in `apps/admin_backend/core/socket_auditor.py` affect UI Mode badges and QR code URLs.
- **Safe Procedure:** Test network detection script across active Wi-Fi, Hotspot, and disconnected network states.

---

## 5. Summary Workflow for AI Agents & Developers

Whenever a change request is received:
1. **Read this guide (`docs/CHANGE_GUIDE.md`)** for the target component.
2. **Generate a Mini-Plan** stating:
   - Target Component & Proposed Change
   - Impacted Files Checklist
   - VRAM & Air-Gap Compliance Confirmation
   - Specific Test Commands to Re-run
3. **Present Mini-Plan to User** and await confirmation (unless explicitly instructed to proceed without plan).
4. **Implement Change** strictly following the safe change procedure.
5. **Execute Verification Tests** and update `docs/tasks.md`.
