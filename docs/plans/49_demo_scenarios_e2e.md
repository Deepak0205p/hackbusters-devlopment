# Plan 49: End-to-End Demo Scenario Walkthrough & Multi-Device Verification Plan

## 1. Objective
Define the step-by-step execution protocol for the official evaluation demo scenarios, verifying standalone execution, LAN multi-device access (Option A), and host-created hotspot direct connection (Option B), demonstrating dual-state proof (connected clients + strictly zero external packets).

## 2. Requirement Mapping
- **SIH26117 Requirement 14:** *END-TO-END INDUSTRIAL AGENTIC TASK* — Scanned inspection PDF to executive Word approval note.
- **SIH26117 Requirement 15:** *CODING TASK EXECUTED IN SANDBOX* — Centrifugal pump efficiency Python code in Docker.
- **SIH26117 Demo Scenarios 1-4 (PDF Page 8):** Complete end-to-end validation.

## 3. Detailed Design & Technical Approach

### 3.1. Demo Scenario 1: Scanned Refinery Inspection Report $\rightarrow$ Executive Word Approval Note
- **Input:** User uploads `data/sample_inputs/inspection_report_furnace.pdf` and prompts: *"Draft an urgent executive approval note for furnace F-101 based on this inspection report and verify against MRPL SOPs."*
- **Execution Flow:**
  1. **Router:** Classifies as Multimodal Vision $\rightarrow$ selects `qwen2-vl-2b`.
  2. **Tool 1 (`paddle_ocr` + Qwen2-VL):** Extracts furnace tube skin temperature ($620^\circ\text{C}$) and corrosion rate ($0.45\text{ mm/yr}$).
  3. **Model Swapping Manager:** Swaps to `qwen3-4b` for reasoning ($< 1.2\text{s}$).
  4. **Tool 2 (`chroma_sop_search`):** Queries ChromaDB for `SOP-MRPL-FURNACE-01 Clause 4.1.2` (Skin temp $> 610^\circ\text{C}$ requires turnaround within 7 days).
  5. **Tool 3 (`docx_generator`):** Generates styled `approval_note_F101.docx` with executive summary, SOP citations, and signature blocks.
  6. **Network Audit:** Confirms 0 external packets transmitted.
- **Deliverable:** `data/outputs/docx/approval_note_F101.docx`.

---

### 3.2. Demo Scenario 2: Autonomous Pump Efficiency Coding & Isolated Docker Sandbox Execution
- **Input:** User prompts: *"Write a Python script to calculate centrifugal pump hydraulic efficiency and brake horsepower for flow 250 m3/h, head 45 m, density 850 kg/m3, shaft power 35 kW. Execute in sandbox."*
- **Execution Flow:**
  1. **Router:** Classifies as Coding $\rightarrow$ selects `qwen2.5-coder-3b`.
  2. **Model Generation:** Generates standalone Python script with formulas:
     $$P_{\text{hyd}} = \frac{250 \times 850 \times 9.81 \times 45}{3600 \times 1000} = 26.04\text{ kW}$$
     $$\eta = \frac{26.04}{35.0} \times 100 = 74.39\%$$
  3. **Tool 1 (`docker_python_sandbox`):** Executes script inside Docker with `--network none`.
  4. **Observation:** Captures `stdout` (26.04 kW, 74.39% efficiency).
  5. **Self-Correction Verification:** If script throws deliberate error, agent parses traceback, fixes line, and re-executes.
  6. **Final Output:** Structured response citing compliance with `SOP-MRPL-PUMP-04 Clause 3.2.0` (minimum 70%).
- **Deliverable:** Downloadable Python script `data/outputs/scripts/pump_efficiency.py`.

---

### 3.3. Demo Scenario 3: Scanned P&ID Engineering Drawing $\rightarrow$ Excel Asset Register
- **Input:** User uploads `data/sample_inputs/engineering_pid_drawing.png` and prompts: *"Extract all equipment tags and valves from this P&ID drawing and export an Excel asset register."*
- **Execution Flow:**
  1. **Router:** Classifies as Vision $\rightarrow$ selects `qwen2-vl-2b`.
  2. **Tool 1 (`paddle_ocr` + Qwen2-VL):** Identifies 9 tags (`P-101A`, `P-101B`, `FCV-102`, `PT-201`, `TT-301`, `HV-105`, etc.).
  3. **Tool 2 (`chroma_sop_search`):** Cross-references tag ratings against `equipment_registry`.
  4. **Tool 3 (`xlsx_generator`):** Generates styled `asset_register.xlsx` with zebra striping and maintenance highlight tags.
- **Deliverable:** `data/outputs/xlsx/asset_register.xlsx`.

---

### 3.4. Demo Scenario 4: Multi-Device Real-Time Sovereignty Audit (Options A & B)
- **Objective:** Demonstrate live multi-device access from judge's phone/laptop while mathematically proving zero external egress.
- **Option A (Venue LAN Test):**
  1. Host and judge connect to venue Wi-Fi.
  2. Judge opens `http://<HOST_LAN_IP>:8000` on phone/laptop.
  3. Sovereignty Dashboard shows:
     - `Localhost Connections`: e.g. 2
     - `LAN / Hotspot Connections`: **`1`**
     - `External Internet Connections`: **`0`**
     - `External Packets Transmitted`: **`0`**
- **Option B (Host-Created Hotspot Test — Standalone Zero Infrastructure):**
  1. Host enables Windows Mobile Hotspot / Linux Hotspot (SSID: `MRPL-SOVEREIGN-AI`, Password: `MRPL2026Sovereign`, **Internet Sharing: OFF**).
  2. Host disconnects from all venue Wi-Fi / Ethernet cables (Host has literally 0 internet access).
  3. Judge scans QR code from host screen and connects to `http://192.168.137.1:8000`.
  4. Judge submits a prompt from their phone; host processes it using local GPU.
  5. Live Sovereignty Dashboard displays:
     - `Deployment Mode`: **`SECONDARY_HOTSPOT_OPTION_B`**
     - `LAN / Hotspot Connections`: **`1` (Judge's Device)**
     - `External Internet Connections`: **`0`**
     - `External Packets Transmitted`: **`0`**
  6. Evaluator clicks *"Export Audit Certificate"*, downloading SHA-256 signed `sovereignty_audit.log`.

## 4. Inputs / Outputs & Contracts
- **Input:** Test input files in `data/sample_inputs/` and multi-device connection.
- **Output:** Verified execution of all 4 demo scenarios with dual-state proof.

## 5. Dependencies on Other Plan Files
- Depends on: All preceding plan files (01 through 48).
- Depended on by: [Plan 50](file:///G:/SIH/p/docs/plans/50_judge_verification_checklist.md).

## 6. Edge Cases & Failure Modes
- **Venue Wi-Fi Blocks Local Device Traffic:** Seamlessly switch to Option B (Host Hotspot) with 0 infrastructure dependency.

## 7. Acceptance Criteria & Verification
- Judge interacts with the workbench from their own device; host executes tasks locally with 0 external network packets.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Dual-state proof (remote client actively connected + 0 external egress) proves that multi-device usability does not compromise national refinery air-gap sovereignty.
