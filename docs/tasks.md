# Pre-Demo Validation Tasks & Action Items
## MRPL Sovereign AI Workbench (SIH26117)

---

## 1. High-Priority Pre-Demo Hardware & Model Validation Checklist

- [x] **Task 1a: Generate Realistic Multi-Section Sample Documents & PDF Parsing (Tier 1)**
  - **Status:** COMPLETED & LIVE-TESTED (Dev Environment)
  - **Details:** Generated real, multi-section MRPL inspection report PDF (`data/sample_inputs/inspection_report_furnace.pdf`, 4.0 KB) with ReportLab tables/thermocouple breach and industrial CAD P&ID blueprint PNG (`data/sample_inputs/engineering_pid_drawing.png`, 33.7 KB) with 9 ISA 5.1 instrumentation tags. Live `pypdf` extraction extracts real text (385 characters) and parses Thermocouple TT-104 ($620^\circ\text{C}$) directly from the file stream.

- [ ] **Task 1b: Full OCR Pipeline Validation on Physically Degraded Scans (Tier 2 Target)**
  - **Priority:** High
  - **Context:** Tier 1 verified live stream parsing from structured PDF assets. Tier 2 requires evaluating PaddleOCR against physical optical scanner noise.
  - **Action:** Before demo day on the competition workstation, run PaddleOCR on physically printed/photocopied & skewed inspection reports to empirically measure Character Error Rate ($CER < 2\%$) and bounding box precision.
  - **Owner:** Backend Multimodal Lead

- [ ] **Task 2: Pull Real Ollama Models & Benchmark Physical GPU Model Swapping (<1.2s)**
  - **Priority:** High
  - **Context:** Dynamic model swap logic was verified with fast simulated fallback ($53\text{ms}$) while Ollama daemon was offline during dev.
  - **Action:** On the actual GPU workstation (RTX 3060/4090), pull all 4 GGUF models (`ollama pull qwen3:4b-q4_k_m`, `ollama pull qwen2.5-coder:3b-q4_k_m`, `ollama pull qwen2-vl:2b-q4_k_m`, `ollama pull llama3.2:3b-q4_k_m`) and run the automated swap test to benchmark real VRAM eviction/load timings ($<1200\text{ms}$ SLA) against the live Ollama API.
  - **Owner:** GPU / Infrastructure Lead

- [ ] **Task 3: Download & Cache BAAI/bge-small-en-v1.5 Weights Locally for True Semantic RAG**
  - **Priority:** High
  - **Context:** In development, vector embedding utilized deterministic local feature hashing to remain 100% offline without initial HuggingFace model weight downloads.
  - **Action:** Download and cache the `BAAI/bge-small-en-v1.5` weights locally into `models/embeddings/bge-small-en-v1.5/` during pre-demo environment staging (via temporary internet access or offline USB transfer). Replace deterministic feature hashing with real `sentence-transformers` inference, and re-run `test_rag_live.py` with cross-domain paraphrase queries to confirm generalized semantic retrieval across all 15 MRPL refinery SOPs.
  - **Owner:** Backend RAG / AI Lead

- [ ] **Task 4: Real Docker Container (--network none) Execution Validation on Target Demo Workstation**
  - **Priority:** High
  - **Context:** In the development sandbox, Docker was not running; execution safely ran on the hardened subprocess fallback with AST screening.
  - **Action:** Before demo day, verify that the active Docker daemon on the target demo workstation is automatically detected by `DockerSandboxManager.is_docker_live`, and confirm that `docker run --network none -m 512m --cpus 2.0 --rm python:3.11-slim` executes with hard kernel-level network isolation. Must show a live re-test with `execution_engine == 'docker_container'` recorded before the hackathon, not just the subprocess fallback path.
  - **Owner:** Backend / Sandbox Lead

- [ ] **Task 5 (Nice-to-Have / Risk Mitigation): Generalize Entity Extraction with Open Regex Parsers**
  - **Priority:** Medium / Optional Risk Mitigation
  - **Context:** Currently, entity extraction uses substring conditionals tailored to the prepared demo PDF (`inspection_report_furnace.pdf`). If evaluators provide an unscripted document during Q&A, fallback values could appear generic.
  - **Action:** Enhance `apps/admin_backend/ocr/pipeline.py` with generalized regex extractors (e.g., `r"([A-Z]{2,4}-\d+)\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:°C|C|bar|mm)"` for sensor tags, temperature limits, and corrosion rates) and zero-shot entity extraction via `Qwen 2.5 Coder 3B` / `Qwen 3 4B` to safely parse arbitrary user-uploaded inspection files.
  - **Owner:** Backend Multimodal Lead

- [ ] **Task 6: Enterprise Multi-GPU vLLM Cluster Client Pre-Deployment Benchmark (Enterprise Hardware Target)**
  - **Priority:** Medium / Enterprise Staging Target
  - **Context:** The `VLLMClusterBackend` client is fully implemented in `apps/admin_backend/models/compute_backends.py` using standard OpenAI-compatible `/v1/chat/completions`, `/v1/models`, and `/health` endpoints. Request payload construction, dynamic registry lookup, and unreachable-cluster error handling are 100% verified.
  - **Action:** Before activating the `enterprise_cluster_80gb_a100` profile in a production datacenter environment, launch `vllm serve <model>` on the target GPU cluster (e.g. 4x or 8x NVIDIA A100/H100 SXM4), configure `VLLM_SERVER_URL` (or `hardware_profiles.yaml`), and execute `test_vllm_real_client.py` to benchmark live cluster throughput ($\sim 300+\text{ tokens/sec}$) and multi-node tensor parallelism.
  - **Owner:** Enterprise Infrastructure / Cluster AI Lead

---

## 2. Status Tracking Summary

| Module | Component | Dev Status | Pre-Demo Real-Hardware Action Required |
| :--- | :--- | :--- | :--- |
| **Module 2** | Model Manager | Plumbed & Tested (Fallback mode) | Pull 4 Ollama models & record real GPU swap latency (Task 2) |
| **Module 2 (Ext)**| Enterprise vLLM Backend | Fully Implemented & Tested (Mock/Error paths) | Benchmark live on multi-GPU A100 cluster via `vllm serve` (Task 6) |
| **Module 6** | OCR & Multimodal | Plumbed & Tested (Magic-byte verified) | Benchmark on multi-page rasterized scan PDF (Task 1b) & generalized regex (Task 5) |
| **Module 8** | Sandbox | Plumbed & Tested (Subprocess AST shield) | Verify live `docker_container` with `--network none` (Task 4) |
| **Module 9** | ChromaDB RAG | Plumbed & Tested (Local feature hash) | Cache `bge-small-en-v1.5` & test synonym ranking (Task 3) |

