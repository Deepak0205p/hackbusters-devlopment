# MRPL Sovereign AI Workbench (SIH26117)
# OFFICIAL DEMO DAY PRESENTATION RUNBOOK & EVALUATOR SCRIPT

> **Hardware Constraint Notice:** NVIDIA GPU $\le 6.0\text{ GB}$ VRAM | **Compliance:** 100% Air-Gapped / Zero External Egress

---

## 1. Pre-Demo Hardware Staging Checklist (Hard Pre-Requisites)

> [!IMPORTANT]
> **MANDATORY PRE-DEMO GATE (Per `docs/tasks.md` Tasks 1–4):**
> You **MUST** complete and verify all 4 hardware-readiness tasks before presenting live to judges.
>
> **OCR Validation Two-Tier Reality (WO-01):**
> - **Tier 1 (Completed & Verified in Dev):** Realistic multi-section rendered inspection report PDF (`data/sample_inputs/inspection_report_furnace.pdf`, 4.0 KB) and ISA 5.1 CAD schematic blueprint PNG (`data/sample_inputs/engineering_pid_drawing.png`, 33.7 KB) generated and verified through live PDF stream parsing.
> - **Tier 2 (Demo Workstation Target):** Run PaddleOCR character error rate benchmark on physically printed/photocopied & degraded scans ($CER < 2\%$).

```
[ ] STEP 1: Docker Daemon Active & Isolated
    - Verify Docker Engine 24.0+ is running: docker info
    - Pull local runner image: docker pull python:3.11-slim
    - Verify kernel isolation test: python -m backend.tests.test_sandbox_live
    - Gate Requirement: Execution engine MUST report "docker_container (python:3.11-slim)"

[ ] STEP 2: Local Ollama Model Weights Loaded
    - Start Ollama daemon: ollama serve
    - Verify all 4 open-weight GGUF models are present:
        • ollama list -> qwen3:4b-q4_k_m
        • ollama list -> qwen2.5-coder:3b-q4_k_m
        • ollama list -> qwen2-vl:2b-q4_k_m
        • ollama list -> llama3.2:3b-q4_k_m
    - Gate Requirement: GPU VRAM resident footprint must measure ~5,500 MB (89.5% of 6,144 MB)

[ ] STEP 3: BAAI/bge-small-en-v1.5 Local Embedding Weights Cached
    - Verify models/embeddings/bge-small-en-v1.5/ directory contains cached weights
    - Run semantic paraphrase test: python -m backend.tests.test_rag_live
    - Gate Requirement: Semantic SOP retrieval hits SOP-MRPL-FURNACE-01 Clause 4.1.2

[ ] STEP 4: Closed Wi-Fi Hotspot Initialized (Enforced Air-Gap)
    - Host Wi-Fi Hotspot SSID: "MRPL-SOVEREIGN-AI" | Password: "MRPL2026Sovereign"
    - Confirm Internet Sharing is toggled OFF (Local isolated subnet 192.168.137.x or 192.168.0.x)
    - Confirm Host IP is resolved: ipconfig / ifconfig

[ ] STEP 5: Start Unified Sovereign Workbench Server
    - Launch Gateway: python -m uvicorn apps.admin_backend.main:app --host 0.0.0.0 --port 8000
    - Verify Gateway health: curl http://127.0.0.1:8000/api/health
    - Open Chrome Browser: http://localhost:8000 (Public Chat) or http://localhost:8000/admin (Admin Observatory)
```

---

## 2. Master Demo Presentation Script (10-Minute Evaluator Sequence)

```
+---------------------------------------------------------------------------------------------------------+
|                                    DEMO SCENARIO TIMELINE OVERVIEW                                      |
+---------------------------------------------------------------------------------------------------------+
|  00:00 - 02:00  | Phase 1: Public Chat Application Experience (http://<host>:8000/)                     |
|                 |          • Judge interacts with the Gemini-replica interface                          |
|                 |          • CDU Furnace F-101 SOP Breach & Automatic Document Synthesis               |
|                 |          • Centrifugal Pump Hydraulic Calculation & ReAct Trace Stream                |
|  02:00 - 05:00  | Phase 2: Under-The-Hood Technical Observatory Reveal (http://<host>:8000/admin/)      |
|                 |          • Reveal Model Status Panel (Screen 1: Dynamic Dual-Slot LRU VRAM Swapping) |
|                 |          • Code Execution Sandbox (Screen 2: Docker AST Network Isolation)            |
|                 |          • Multimodal Ingestion Hub (Screen 3: PDF / P&ID ISA 5.1 Tag OCR)           |
|  05:00 - 07:30  | Phase 3: Provable Sovereignty Daemon & Kernel Socket Sniffer (Screen 4)                |
|                 |          • 3-Tier Packet Sniffer (External WAN = 0 Packets)                           |
|                 |          • SHA-256 Tamper-Evident Hash Chain Verification & Certificate Download      |
|  07:30 - 09:00  | Phase 4: Remote Evaluator Access & Multi-Device Pairing (Screen 6)                     |
|                 |          • Live QR Code Scan via closed Wi-Fi Hotspot ("MRPL-SOVEREIGN-AI")           |
|  09:00 - 10:00  | Phase 5: Evaluator Q&A & Technical Defense                                            |
+---------------------------------------------------------------------------------------------------------+
```

---

### PHASE 1: Public Chat Experience (Judge Interaction with Primary UI)
**Target URL:** `http://127.0.0.1:8000/` (Public Chat App)  
**Presenter Action:** Hand laptop/tablet to judge or guide them through the Gemini-style interface.  
**Active Compute:** Real-time ReAct Reasoning Engine + On-Premise GPU Compute Backend

#### Live Action Sequence:
1. **Public Landing & Starter Prompts:**
   - Present the clean, distraction-free conversational canvas.
   - Click the starter card: **"Furnace F-101 SOP Audit"** (or type: `Review Crude Distillation Unit furnace F-101 thermocouple telemetry and evaluate compliance against SOP-MRPL-FURNACE-01`).
2. **Explain the Real-Time Thinking Stream:**
   - As tokens stream in, point to the collapsible **"Thought process"** accordion.
   - Click the accordion to reveal the ReAct frames: SOP retrieval from ChromaDB, threshold analysis, and automatic Word document generation.
3. **Artifact Download:**
   - Point out the generated deliverable badge: `MRPL_Furnace_Inspection_Approval_Note.docx`.
   - Click download and open the generated file to show the structured tables, executive header, and compliance checklist.

---

### PHASE 2: Under-The-Hood Technical Observatory Reveal
**Target URL:** `http://127.0.0.1:8000/admin/` (Admin Observatory)  
**Presenter Action:** Open the operator dashboard to reveal how the sovereign backend executed the judge's request.

#### Live Action Sequence:
1. **Tab 1: Models & VRAM Status Panel:**
   - Show the dynamic Dual-Slot LRU VRAM memory gauge ($5,500\text{ MB} / 6,144\text{ MB}$, $89.5\%$).
   - Show how the reasoning engine remains locked in Slot 0 while Slot 1 dynamically manages coding and vision specialists.
2. **Tab 3: Multimodal Ingestion & OCR Hub:**
   - Demonstrate the 5-Stage Ingestion Pipeline on `inspection_report_furnace.pdf` and `engineering_pid_drawing.png`.
   - Show ISA 5.1 tag extraction and automatic ChromaDB SOP violation cross-referencing.
3. **Tab 5: Generated Deliverables Repository:**
   - Show all generated executive Word notes, Excel calculation registers, and briefing decks ready for instant download.

---

### PHASE 3: Provable Sovereignty Daemon & Multi-Device Pairing
**Target URL:** `http://127.0.0.1:8000/admin/` (Tabs 4 & 6)

#### Live Action Sequence:
1. **Tab 4 (Sovereignty Dashboard):**
   - Point to the live kernel socket sniffer: Localhost is active, LAN is active, but **External WAN Packets is exactly ZERO (0)**.
   - Click **"Verify Hash Chain"**: Recomputes SHA-256 signatures across all blocks, outputting `CRYPTOGRAPHIC_INTEGRITY_VERIFIED (Valid: True)`.
   - Click **"Export Audit Certificate"** to download the signed JSON certificate.
2. **Tab 6 (Remote Access Panel):**
   - Display the live QR code: judges connect their devices to hotspot `"MRPL-SOVEREIGN-AI"` to interact with the Public Chat App or view the live dashboard.
   - Show the connected clients counter incrementing in real time.

---

## 3. Live Evaluator Q&A & Architecture Defense Guide

| Anticipated Judge Question | Spoken Defense & Technical Proof |
| :--- | :--- |
| **"This runs on a laptop, but does it actually scale to real enterprise datacenter clusters?"** | *"Yes, 100% genuinely and without refactoring a single line of code. Our backend enforces a strict Zero-Refactor Scaling Principle: (1) Hardware tiers are configured via `hardware_profiles.yaml` (from `edge_laptop_6gb` to `enterprise_cluster_80gb_a100`), where eviction strategies dynamically shift from 2-model LRU swapping to all-resident multi-GPU concurrency; (2) Router domains are self-configuring from `models.yaml` — adding a 5th model with a new domain like `financial_analysis` immediately auto-compiles regex patterns and semantic centroids with zero Python edits; (3) Compute fabrics (Ollama, vLLM, Ray) and tools (SCADA, SAP) use open decorator registries (`@register_compute_backend`, `@tool_registry.register`)."* |
| **"How do you fit 4 models into a 6GB VRAM budget?"** | *"We use an asymmetric Dual-Slot LRU Architecture. The primary reasoning model (2.6GB) stays permanently locked in Slot 0. Slot 1 dynamically loads either Coder (1.9GB) or Vision (1.9GB) on demand. With 400MB OS overhead and 600MB KV cache, total peak VRAM is exactly 5,500 MB (89.5%), leaving 644 MB safe headroom."* |
| **"How do we know data isn't secretly leaking to the cloud?"** | *"Our Sovereignty Daemon monitors all AF_INET sockets at the OS kernel level. Every socket connection is hashed into an append-only SHA-256 tamper-evident chain. Judges can export the audit certificate and verify the cryptographic signature independently."* |
| **"What if Python script execution tries to escape or access the network?"** | *"All code execution runs inside Docker with `--network none`, 512MB RAM cap, and 15-second timeout. Additionally, our pre-execution AST Screener statically analyzes the Python syntax tree and blocks forbidden imports (`socket`, `urllib`, `os`, `subprocess`) before the process even spawns."* |

---

## 4. Live Troubleshooting & Fallback Procedures

```
+------------------------------------+--------------------------------------------------------------------+
| Symptom / Issue                    | Immediate Corrective Action                                        |
+------------------------------------+--------------------------------------------------------------------+
| Judge cannot connect to QR code    | 1. Verify judge joined SSID "MRPL-SOVEREIGN-AI".                   |
|                                    | 2. Tell judge to open browser directly to: http://<host-ip>:8000   |
|                                    | 3. Switch deployment mode toggle on Screen 6 to "Venue LAN" (Opt A)|
+------------------------------------+--------------------------------------------------------------------+
| Model swap takes > 2 seconds       | 1. Run "ollama ps" in terminal to check if standby model evicted.  |
|                                    | 2. Manually trigger swap on Screen 1 to warm up GPU cache.         |
+------------------------------------+--------------------------------------------------------------------+
| Port 8000 conflict on startup      | Run: netstat -ano | findstr :8000                                  |
|                                    | Kill conflicting PID: taskkill /PID <PID> /F                       |
|                                    | Restart gateway: uvicorn apps.admin_backend.main:app --port 8000             |
+------------------------------------+--------------------------------------------------------------------+
```
