# Plan 43: FastAPI Endpoint Design & REST API Gateway Architecture

## 1. Objective
Design the complete asynchronous REST API gateway in `backend/main.py` and `backend/api/` route modules, binding to `0.0.0.0:8000` to support both local and remote multi-device connections (LAN/Hotspot), serving Next.js static export frontend files, and implementing strict Pydantic validation across all endpoints.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED PLATFORM ON OWN GPU SERVER* — Localhost and LAN-accessible API server endpoints.
- **SIH26117 Requirement 10:** *PRODUCTION DELIVERABLE GENERATION* — File download endpoints.
- **SIH26117 Requirement 12:** *PROVABLE SOVEREIGNTY AUDITING* — Sovereignty audit inspection and log export endpoints.

## 3. Detailed Design & Technical Approach

### 3.1. Route Registry Matrix

| Method | Endpoint Path | Module Handler | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/models` | `routes_models.py` | Lists registered models, active status, and VRAM memory summary. |
| **`POST`**| `/api/models/swap` | `routes_models.py` | Manually loads or swaps an active model in GPU VRAM. |
| **`POST`**| `/api/chat` | `routes_chat.py` | Submits task prompt to agent; returns final answer and trace. |
| **`POST`**| `/api/upload` | `routes_upload.py` | Uploads multimodal files (PDF, PNG, JPG) to local storage. |
| **`GET`** | `/api/network-status` | `routes_audit.py` | Returns active deployment mode (Standalone/LAN/Hotspot), Host IP, and QR connect payload. |
| **`GET`** | `/api/sovereignty-audit` | `routes_audit.py` | Returns 3-tier socket counts, external packet count (0), and status. |
| **`GET`** | `/api/sovereignty-audit/export`| `routes_audit.py` | Exports cryptographic SHA-256 audit log certificate. |
| **`GET`** | `/api/files/download/{filename}` | `routes_files.py` | Streams generated `.docx`, `.xlsx`, `.pptx`, `.py` deliverables. |
| **`GET`** | `/api/health` | `main.py` | Returns server operational status and VRAM headroom. |

### 3.2. Network Status Endpoint Implementation (`backend/api/routes_audit.py`)
```python
from fastapi import APIRouter
from backend.core.socket_auditor import SocketAuditor

router = APIRouter(prefix="/api", tags=["Sovereignty & Network"])

@router.get("/network-status")
async def get_network_status():
    auditor = SocketAuditor()
    net_info = auditor.detect_network_mode()
    port = 8000
    host_ip = net_info["primary_ip"]
    connect_url = f"http://{host_ip}:{port}"
    
    return {
        "status": "SUCCESS",
        "deployment_mode": net_info["mode"],
        "host_ip": host_ip,
        "port": port,
        "connect_url": connect_url,
        "hotspot_instructions": {
            "ssid": "MRPL-SOVEREIGN-AI",
            "password": "MRPL2026Sovereign",
            "internet_sharing": "OFF (Enforced Air-Gap)"
        } if net_info["mode"] == "HOTSPOT_OPTION_B" else None,
        "qr_code_payload": connect_url
    }
```

## 4. Inputs / Outputs & Contracts
- **Input:** JSON request payloads conforming to Pydantic schemas.
- **Output:** Structured JSON responses with standard HTTP status codes (`200 OK`, `400 Bad Request`, `500 Internal Error`).

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 07](file:///G:/SIH/p/docs/plans/07_ollama_integration.md), [Plan 10](file:///G:/SIH/p/docs/plans/10_model_swapping_lru.md), [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md), [Plan 40](file:///G:/SIH/p/docs/plans/40_socket_watchdog.md).
- Depended on by: [Plan 44](file:///G:/SIH/p/docs/plans/44_websocket_streaming.md), [Plan 45](file:///G:/SIH/p/docs/plans/45_backend_testing_plan.md), [Plan 46](file:///G:/SIH/p/docs/plans/46_nextjs_static_export.md).

## 6. Edge Cases & Failure Modes
- **CORS Configuration for LAN / Hotspot:** Allow dynamic origins for private RFC 1918 subnets (`192.168.*`, `10.*`, `172.*`, `localhost`) so evaluator devices can make API requests seamlessly.

## 7. Acceptance Criteria & Verification
- All REST endpoints respond cleanly when queried from both localhost and a secondary device over LAN / Hotspot.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Binding to `0.0.0.0:8000` allows the same single FastAPI instance to serve both local and remote users simultaneously while Ollama remains protected on `127.0.0.1:11434`.
