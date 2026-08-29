# API Contracts & Schemas (Reconciled with Frontend Implementation)
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

All endpoints strictly bind to `0.0.0.0:8000` to allow both localhost and multi-device private connections (Option A Venue LAN / Option B Host Hotspot). No external internet communication or cloud authentication tokens are utilized.

---

## 1. Model Management Endpoints

### 1.1. `GET /api/models`
Returns the list of registered models, current active status, quantization, and VRAM memory footprint.

- **Request:** None
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

### 1.2. `POST /api/models/swap`
Dynamically pages out the secondary model from VRAM and loads the requested target model.

- **Request Body:**
```json
{
  "model_id": "qwen2.5-coder-3b"
}
```

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

## 2. Agent Execution & WebSocket Streaming Endpoints

### 2.1. `WS /api/chat/stream`
Full-duplex WebSocket delivering real-time routing decisions, ReAct agent loop reasoning traces, and token output.

- **Inbound Message:**
```json
{
  "prompt": "Calculate hydraulic power and operating efficiency for crude charge pump P-101A...",
  "attachments": []
}
```

- **Outbound Stream Frames:**
1. Routing: `{"event": "routing", "domain": "coding", "model_id": "qwen2.5-coder-3b", "routed_by": "stage1_regex", "confidence": 98}`
2. ReAct Step: `{"event": "step", "step_number": 1, "step_type": "thought", "content": "...", "duration_ms": 110, "ram_mb": 40}`
3. ReAct Action: `{"event": "step", "step_number": 2, "step_type": "action", "content": "...", "tool_name": "docker_sandbox", "tool_input": "...", "tool_output": "...", "duration_ms": 92, "ram_mb": 35}`
4. Final Answer: `{"event": "final_answer", "content": "...", "model_id": "qwen2.5-coder-3b", "routed_by": "stage1_regex", "confidence": 98, "deliverable_ids": ["P101A_Hydraulic_Calculation_Register.xlsx"]}`

---

## 3. Multimodal File Ingestion & OCR Endpoints

### 3.1. `POST /api/upload`
Uploads scanned inspection reports, engineering drawings, or handwritten logs for local CPU OCR and visual analysis.

- **Request:** `multipart/form-data` (`file: UploadFile`)
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
    {
      "key": "Tube Skin Thermocouple",
      "value": "620 °C (Safe Limit: 610 °C)",
      "category": "temperature",
      "confidence": 98,
      "highlight": true
    }
  ],
  "raw_ocr_text": "MRPL REFINERY CRUDE DISTILLATION UNIT\nEQUIPMENT INSPECTION LOG: FURNACE F-101...",
  "sop_violations": [
    "SOP-MRPL-FURNACE-01 Clause 4.1.2: Skin temperature > 610°C requires mandatory derating and shutdown within 7 days."
  ],
  "status": "ready"
}
```

---

## 4. Sovereignty Telemetry & Network Endpoints

### 4.1. `WS /api/audit-stream`
Broadcasts live 1000ms 3-tier network socket & VRAM telemetry frames.

### 4.2. `GET /api/sovereignty-audit/export`
Exports cryptographic SHA-256 hash-chained JSON verification certificate.

### 4.3. `GET /api/network-status`
Returns active host IP, deployment topology (Standalone / Option A LAN / Option B Hotspot), and QR connect URL.

---

## 5. File Delivery & Deliverables Endpoints

### 5.1. `GET /api/files/download/{filename}`
Streams generated `.docx`, `.xlsx`, `.pptx`, and `.py` deliverables with path traversal protection against `data/outputs/`.
