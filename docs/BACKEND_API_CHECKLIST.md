# Backend API Implementation Checklist
## Single Source of Truth for Backend REST & WebSocket Services
*Derived directly from verified Next.js frontend state contracts & production export build.*

---

## 1. Core Gateway & Static Hosting

- [ ] **Static UI Mount (`/*`)**:
  - Serves `frontend/out/` via FastAPI's `StaticFiles(directory="frontend/out", html=True)`.
  - Enables full single-page app (SPA) loading from `http://127.0.0.1:8000`, `http://192.168.1.50:8000` (LAN), and `http://192.168.137.1:8000` (Hotspot).
- [ ] **Health Endpoint (`GET /api/health`)**:
  - Returns `200 OK` with `{ "status": "HEALTHY", "airgap": "VERIFIED", "timestamp": float }`.
- [ ] **CORS Configuration**:
  - Dynamically permits private RFC 1918 subnets (`127.0.0.1`, `localhost`, `192.168.*`, `10.*`, `172.16-31.*`) for remote multi-device access.

---

## 2. Screen 1: Model Management & VRAM Layer

- [ ] **`GET /api/models`**:
  - **Response `200 OK`:**
    ```json
    [
      {
        "id": "qwen3-4b",
        "name": "Qwen 3 4B",
        "ollama_tag": "qwen3:4b-q4_k_m",
        "quantization": "GGUF Q4_K_M",
        "vram_mb": 2800,
        "context_length": 8192,
        "domain": "reasoning",
        "is_primary": true,
        "keep_alive": "5m",
        "status": "active",
        "description": "Primary reasoning, planning, multi-step ReAct orchestration & SOP synthesis"
      },
      {
        "id": "qwen2.5-coder-3b",
        "name": "Qwen 2.5 Coder 3B",
        "ollama_tag": "qwen2.5-coder:3b-q4_k_m",
        "quantization": "GGUF Q4_K_M",
        "vram_mb": 2000,
        "context_length": 8192,
        "domain": "coding",
        "is_primary": false,
        "keep_alive": "5m",
        "status": "active",
        "description": "Specialized code generation, Python script synthesis, and hydraulic calculations"
      },
      {
        "id": "qwen2-vl-2b",
        "name": "Qwen2-VL 2B",
        "ollama_tag": "qwen2-vl:2b-q4_k_m",
        "quantization": "GGUF Q4_K_M",
        "vram_mb": 2000,
        "context_length": 4096,
        "domain": "vision",
        "is_primary": false,
        "keep_alive": "5m",
        "status": "standby",
        "description": "Multimodal vision model for P&ID schematics and engineering drawings"
      },
      {
        "id": "llama-3.2-3b",
        "name": "Llama 3.2 3B",
        "ollama_tag": "llama3.2:3b-q4_k_m",
        "quantization": "GGUF Q4_K_M",
        "vram_mb": 2000,
        "context_length": 4096,
        "domain": "general",
        "is_primary": false,
        "keep_alive": "5m",
        "status": "standby",
        "description": "General assistant, conversational dialogue, and general fallback"
      }
    ]
    ```
- [ ] **`POST /api/models/swap`**:
  - **Request Body:** `{ "model_id": "qwen2.5-coder-3b" }`
  - **Behavior:** Unloads active secondary model from Ollama, loads requested model, records timing.
  - **Response `200 OK`:**
    ```json
    {
      "id": "swap-1724552400",
      "timestamp": "02:40:12",
      "from_model": "Qwen2-VL 2B",
      "to_model": "Qwen 2.5 Coder 3B",
      "duration_ms": 880,
      "status": "success",
      "trigger": "manual_override",
      "target_met": true
    }
    ```

---

## 3. Screen 2: Agent Engine & ReAct Streaming

- [ ] **`WS /api/chat/stream`**:
  - **Client Inbound Message:**
    ```json
    {
      "prompt": "Write a Python script to calculate centrifugal pump hydraulic efficiency...",
      "attachments": []
    }
    ```
  - **Server Outbound Event Sequence:**
    1. **Routing Decision (`event: "routing"`):**
       ```json
       {
         "event": "routing",
         "domain": "coding",
         "model_id": "qwen2.5-coder-3b",
         "routed_by": "stage1_regex",
         "confidence": 98
       }
       ```
    2. **ReAct Loop Steps (`event: "step"`):**
       ```json
       {
         "event": "step",
         "step_number": 1,
         "step_type": "thought",
         "content": "Task requires hydraulic power calculation...",
         "tool_name": null,
         "tool_input": null,
         "tool_output": null,
         "duration_ms": 110,
         "ram_mb": 40
       }
       ```
       ```json
       {
         "event": "step",
         "step_number": 2,
         "step_type": "action",
         "content": "Executing Python in isolated sandbox...",
         "tool_name": "docker_sandbox",
         "tool_input": "{\"script\": \"pump_calc.py\"}",
         "tool_output": "TypeError: unsupported operand type(s)...",
         "duration_ms": 92,
         "ram_mb": 35
       }
       ```
       ```json
       {
         "event": "step",
         "step_number": 3,
         "step_type": "correction",
         "content": "Self-Correction Attempt 1/10: Casting divisor...",
         "tool_name": "self_correction_loop",
         "tool_input": "{\"exception\": \"TypeError\"}",
         "tool_output": "Corrected line...",
         "duration_ms": 140,
         "ram_mb": 42
       }
       ```
       ```json
       {
         "event": "step",
         "step_number": 4,
         "step_type": "observation",
         "content": "Sandbox execution successful (Exit code 0)...",
         "tool_name": "docker_sandbox",
         "tool_input": "{\"script\": \"pump_calc_fixed.py\"}",
         "tool_output": "{\"hydraulic_power_kw\": 130.23, \"efficiency_pct\": 81.39}",
         "duration_ms": 84,
         "ram_mb": 32
       }
       ```
    3. **Final Response (`event: "final_answer"`):**
       ```json
       {
         "event": "final_answer",
         "content": "Hydraulic calculation complete for Crude Charge Pump P-101A...",
         "model_id": "qwen2.5-coder-3b",
         "routed_by": "stage1_regex",
         "confidence": 98,
         "deliverable_ids": ["P101A_Hydraulic_Calculation_Register.xlsx"]
       }
       ```

---

## 4. Screen 3: File Ingestion & OCR Hub

- [ ] **`POST /api/upload`**:
  - **Request:** `multipart/form-data` with `file: UploadFile`.
  - **Server Invariants:**
    - Size verification ($\le 50\text{MB}$).
    - Extension whitelist: `.pdf`, `.png`, `.jpg`, `.jpeg`.
    - Computes SHA-256 hash.
    - Executes PaddleOCR (CPU) + Qwen2-VL vision parsing + ChromaDB SOP lookup.
  - **Response `200 OK`:**
    ```json
    {
      "id": "doc-furnace-f101",
      "name": "inspection_report_furnace.pdf",
      "size_bytes": 342150,
      "size_formatted": "334.1 KB",
      "mime_type": "application/pdf",
      "type": "inspection_pdf",
      "upload_timestamp": "02:41:10",
      "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "ocr_engine": "paddleocr",
      "findings": [
        { "key": "Tube Skin Thermocouple", "value": "620 °C (Safe Limit: 610 °C)", "category": "temperature", "confidence": 98, "highlight": true },
        { "key": "Wall Thinning / Corrosion", "value": "0.45 mm/year", "category": "corrosion", "confidence": 96, "highlight": true }
      ],
      "raw_ocr_text": "MRPL REFINERY CRUDE DISTILLATION UNIT\nEQUIPMENT INSPECTION LOG: FURNACE F-101...",
      "sop_violations": [
        "SOP-MRPL-FURNACE-01 Clause 4.1.2: Skin temperature > 610°C requires mandatory derating and shutdown within 7 days."
      ],
      "status": "ready"
    }
    ```

---

## 5. Screen 4: Sovereignty Audit & 3-Tier Watchdog

- [ ] **`WS /api/audit-stream`**:
  - **Broadcast Frequency:** Every 1000ms.
  - **Payload Schema:**
    ```json
    {
      "timestamp": 1724552400.0,
      "deployment_mode": "HOTSPOT_OPTION_B",
      "host_ip": "192.168.137.1",
      "vram": {
        "total_mb": 6144,
        "used_mb": 5500,
        "free_mb": 644,
        "usage_percent": 89.5,
        "os_overhead_mb": 500,
        "primary_model_mb": 2800,
        "secondary_model_mb": 2000,
        "kv_cache_mb": 700
      },
      "sovereignty": {
        "verdict": "100% AIR-GAPPED & SOVEREIGN",
        "localhost_connections": 4,
        "lan_hotspot_connections": 1,
        "external_internet_connections": 0,
        "localhost_packets": 3420,
        "lan_hotspot_packets": 840,
        "external_packets": 0,
        "external_bytes": 0,
        "total_packets_sniffed": 4260,
        "daemon_heartbeat_hz": 1.0,
        "sockets": [
          { "id": "s-1", "pid": 1420, "process_name": "python.exe (FastAPI Gateway)", "local_address": "0.0.0.0:8000", "remote_address": "0.0.0.0:*", "tier": "LOCALHOST", "status": "LISTEN", "security_verdict": "PERMITTED" },
          { "id": "s-2", "pid": 1420, "process_name": "python.exe (FastAPI Gateway)", "local_address": "192.168.137.1:8000", "remote_address": "192.168.137.45:49218", "tier": "LAN_HOTSPOT", "status": "ESTABLISHED", "security_verdict": "PERMITTED" }
        ],
        "breaches": []
      }
    }
    ```
- [ ] **`GET /api/sovereignty-audit/export`**:
  - **Behavior:** Generates signed SHA-256 hash-chained JSON certificate.
  - **Response `200 OK`:** Downloadable file `sovereignty_audit_certificate.json`.

---

## 6. Screen 5: Deliverable Registry & File Streaming

- [ ] **`GET /api/files`**:
  - Returns list of generated `.docx`, `.xlsx`, `.pptx`, `.py` artifacts in `data/outputs/`.
- [ ] **`GET /api/files/download/{filename}`**:
  - **Security Invariant:** Hard path-traversal sanitization (`os.path.abspath(target_path).startswith(os.path.abspath("data/outputs"))`).
  - Streams binary file with correct MIME type (`FileResponse`).

---

## 7. Screen 6: Remote Multi-Device Connectivity

- [ ] **`GET /api/network-status`**:
  - **Response `200 OK`:**
    ```json
    {
      "status": "SUCCESS",
      "deployment_mode": "HOTSPOT_OPTION_B",
      "host_ip": "192.168.137.1",
      "port": 8000,
      "connect_url": "http://192.168.137.1:8000",
      "hotspot_instructions": {
        "ssid": "MRPL-SOVEREIGN-AI",
        "password": "MRPL2026Sovereign",
        "internet_sharing": "OFF (Enforced Air-Gap)"
      },
      "qr_code_payload": "http://192.168.137.1:8000"
    }
    ```
