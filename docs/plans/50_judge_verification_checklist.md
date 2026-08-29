# Plan 50: Judge-Facing Verification Matrix & Multi-Device Compliance Checklist

## 1. Objective
Establish the definitive, point-by-point compliance matrix mapping all 15 requirements from the SIH26117 problem statement (Pages 5-6) and the multi-device deployment options (Primary Standalone, Option A Venue LAN, Option B Host Hotspot) to verifiable demonstration evidence, CLI commands, and test artifacts.

## 2. Requirement Mapping
- **SIH26117 Full Compliance Table (Items 01 through 15):** 100% statutory coverage.
- **Multi-Device Deployment Extension:** Complete verification of Option A (Venue LAN) and Option B (Host Hotspot with Internet Sharing OFF).

## 3. The 15-Point Judge Verification Matrix

| Row | SIH26117 Requirement | Architectural Implementation | Exact Live Verification Command & Evidence |
| :--- | :--- | :--- | :--- |
| **01** | **SELF-HOSTED PLATFORM ON OWN GPU SERVER** | Complete backend and model stack runs entirely on localhost/host-IP via local Ollama and FastAPI instances on port 8000. | Open browser at `http://127.0.0.1:8000` or `http://192.168.137.1:8000`. Netstat confirms 8000 binding. Zero cloud tokens in `.env`. |
| **02** | **AIR-GAPPED, NOTHING LEAVES PREMISES** | Network boundary watchdog enforces local-only communication; zero WAN sockets across Standalone, LAN, and Hotspot modes. | Live UI Sovereignty banner displaying 0 external packets; Wireshark capture on physical NIC showing 0 transmitted frames. |
| **03** | **SINGLE WORKSTATION WITH MID-RANGE GPU** | GGUF Q4_K_M quantized models fit within 6.0GB VRAM ceiling (0.5GB OS + 2.8GB Primary + 2.0GB Secondary + 0.7GB KV Cache). | `nvidia-smi` live terminal output showing active GPU memory allocation stably at ~4.8 GB / 6.0 GB ceiling. |
| **04** | **MULTIPLE OPEN-WEIGHT MODELS SUPPORT** | Four specialized models configured concurrently: Qwen 3 4B, Qwen 2.5 Coder 3B, Qwen2-VL 2B, Llama 3.2 3B. | `GET /api/models` returning active local model inventory, quantizations, and status. |
| **05** | **AUTO-SELECTION OF SPECIALIZED MODELS** | Two-stage dynamic task router auto-classifies prompts into Coding, Reasoning, Vision, and General domains. | Sequential prompt submission: Code prompt $\rightarrow$ Coder 3B tag in UI; Reasoning prompt $\rightarrow$ Qwen 3 4B tag in UI. |
| **06** | **NEW OPEN-WEIGHT MODELS EASILY ADDABLE** | Declarative `models.yaml` registry allows hot-adding new models without code refactoring. | Edit `models.yaml` to add a new model entry; refresh UI to verify immediate catalog availability without restart. |
| **07** | **AGENTIC MULTI-STEP PLANNING** | LangChain ReAct agent decomposes abstract goals into structured action steps (up to 10 iterations). | Visual UI trace displaying sequential Thought $\rightarrow$ Action $\rightarrow$ Observation accordions. |
| **08** | **LOCAL TOOLS EXECUTION** | Isolated Docker Python sandbox, Office deliverable generators, and ChromaDB vector search. | Execution of Python scripts in Docker and instant vector retrieval in UI. |
| **09** | **MULTIMODAL INPUTS (SCANNED PDFS, DRAWINGS)**| Integrated dual-stream pipeline coupling PaddleOCR extraction with Qwen2-VL spatial reasoning. | Uploading scanned furnace inspection PDF and P&ID engineering drawing with full analysis. |
| **10** | **REAL PRODUCTION FILE OUTPUTS** | Programmatic generators (`python-docx`, `openpyxl`, `python-pptx`) output styled enterprise files. | Instant generation and browser download of `approval_note.docx`, `asset_register.xlsx`, and `pump_calc.py`. |
| **11** | **GROUNDED IN ORGANIZATION MANUALS/SOPS** | Local embedded ChromaDB + `BAAI/bge-small-en-v1.5` indexing MRPL refinery manuals and safety SOPs. | RAG retrieval output citing exact clause numbers (e.g. `SOP-MRPL-FURNACE-01 Clause 4.1.2`, Page 14). |
| **12** | **PROVABLE SOVEREIGNTY VIA NETWORK MONITOR** | Real-time socket sniffer (`psutil` + `scapy`) continuously audits open sockets, categorizing 3 tiers. | Live UI Sovereignty Dashboard displaying 0 external packets and exportable SHA-256 signed audit log. |
| **13** | **MODEL AUTO-SELECTION (2+ TASK TYPES)** | Empirical validation of auto-routing across Coding, Deep Reasoning, and Vision tasks. | 3 distinct prompt inputs trigger 3 different model activations automatically. |
| **14** | **END-TO-END INDUSTRIAL AGENTIC TASK** | Ingests scanned inspection report $\rightarrow$ extracts findings $\rightarrow$ verifies SOPs $\rightarrow$ generates Word approval note. | Full workflow execution from PDF upload to downloadable `approval_note.docx` in $< 45\text{ seconds}$. |
| **15** | **CODING TASK EXECUTED IN SANDBOX** | Generates pump efficiency Python calculation code and safely executes inside Docker container. | Terminal view showing Docker container spin-up (`--network none`), execution, stdout capture, and cleanup. |

---

## 4. Multi-Device Verification Protocols (Dual-State Proof)

### Verification Protocol 1: Venue LAN (Option A)
1. Connect host and judge's device to venue Wi-Fi.
2. Open `http://<HOST_LAN_IP>:8000` on judge's device.
3. Submit task $\rightarrow$ host executes locally on GPU.
4. **Evidence:** Sovereignty Dashboard shows `LAN / Hotspot Connections: 1`, `External Internet Connections: 0`, `External Packets: 0`.

### Verification Protocol 2: Host-Created Closed Wi-Fi Hotspot (Option B — Standalone Zero Dependency)
1. Host enables native Mobile Hotspot (**Internet Sharing: OFF**).
2. Host physically disconnects from all venue Wi-Fi / Ethernet networks (0 internet connectivity on host).
3. Judge scans QR code from workbench screen, connecting to `http://192.168.137.1:8000`.
4. Judge executes Scenario 1 (Furnace Inspection) or Scenario 2 (Pump Efficiency) from their smartphone.
5. **Evidence:** Workbench processes task smoothly; Sovereignty Dashboard confirms:
   - `Deployment Mode`: `SECONDARY_HOTSPOT_OPTION_B`
   - `LAN / Hotspot Connections`: `1` (Active client)
   - `External Internet Connections`: `0`
   - `External Packets Transmitted`: `0`
6. Click *"Export Audit Certificate"* to produce signed tamper-evident verification file.
