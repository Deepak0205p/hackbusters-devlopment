# Plan 46: Next.js Static Export Architecture & FastAPI Multi-Device Hosting

## 1. Objective
Design the static export configuration (`next.config.mjs`) for Next.js 14 App Router and configure FastAPI `StaticFiles` mounting in `backend/main.py` to serve the compiled application across all interfaces (`0.0.0.0:8000`), enabling dynamic host IP resolution so any connecting device automatically connects to the correct backend host.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED PLATFORM ON OWN GPU SERVER* — Accessible via localhost and LAN/Hotspot interfaces on port 8000.
- **SIH26117 Requirement 02:** *ZERO EXTERNAL EGRESS* — Pure offline client bundle without external CDNs.

## 3. Detailed Design & Technical Approach

### 3.1. Next.js Static Export Configuration (`frontend/next.config.mjs`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true // Pure static export without Node.js image optimization server
  }
};

export default nextConfig;
```

### 3.2. Dynamic Host Resolution in Frontend Client
Frontend code avoids hardcoded `localhost:8000` by dynamically inferring the current host origin:
```javascript
// frontend/src/lib/api.js
export const getBaseApiUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

export const getBaseWsUrl = () => {
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.hostname}:8000`;
  }
  return 'ws://127.0.0.1:8000';
};
```

### 3.3. FastAPI Static Mounting & Binding (`backend/main.py`)
```python
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.api import (
    routes_models, routes_chat, routes_upload,
    routes_audit, routes_files, routes_websockets
)

app = FastAPI(
    title="MRPL Sovereign Industrial AI Workbench",
    version="1.0.0",
    docs_url="/docs"
)

# Open CORS to local private network subnets
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(routes_models.router)
app.include_router(routes_chat.router)
app.include_router(routes_upload.router)
app.include_router(routes_audit.router)
app.include_router(routes_files.router)
app.include_router(routes_websockets.router)

# Mount Next.js Static Build Assets (frontend/out/)
frontend_out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/out"))
if os.path.exists(frontend_out_dir):
    app.mount("/", StaticFiles(directory=frontend_out_dir, html=True), name="static_frontend")
```

## 4. Inputs / Outputs & Contracts
- **Input:** Built static files in `frontend/out/`.
- **Output:** Application delivered seamlessly to any browser connecting via `http://localhost:8000`, `http://192.168.1.X:8000` (LAN), or `http://192.168.137.1:8000` (Hotspot).

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).
- Depended on by: [Plan 47](file:///G:/SIH/p/docs/plans/47_ui_components.md), [Plan 48](file:///G:/SIH/p/docs/plans/48_frontend_state_websocket.md).

## 6. Edge Cases & Failure Modes
- **Accessing from Mobile Device / iPad:** Dynamic host discovery via `window.location.hostname` ensures WebSocket and API connections immediately route to the host workstation's IP.

## 7. Acceptance Criteria & Verification
- Navigating to `http://<HOST_HOTSPOT_IP>:8000` from an external smartphone/laptop loads the UI and establishes WebSocket communication without manual configuration.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** `allow_origin_regex` for RFC 1918 subnets enables multi-device connectivity without exposing CORS to public internet domains.
