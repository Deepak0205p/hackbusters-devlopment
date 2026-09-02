import os
import sys

# ==============================================================================
# ENFORCE 100% AIR-GAP OFFLINE MODE (Zero HuggingFace / ChromaDB WAN Telemetry)
# ==============================================================================
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_DATASETS_OFFLINE"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["DO_NOT_TRACK"] = "1"

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from apps.user_backend.api.routes_chat import router as chat_router
from apps.user_backend.api.routes_upload import router as upload_router
from apps.user_backend.api.routes_files import router as files_router
from apps.user_backend.api.routes_ocr import router as ocr_router
from apps.user_backend.api.routes_sandbox import router as sandbox_router
from apps.user_backend.api.routes_health import router as health_router

# 1. Instantiate Core FastAPI Application
app = FastAPI(
    title="MRPL Sovereign AI Workbench - User API",
    description="User-facing API for chat, document upload, OCR, sandbox execution, and deliverable downloads (SIH26117)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 2. Configure LAN / Hotspot Multi-Device Private CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(http://)?(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register User API Routers
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(upload_router)
app.include_router(files_router)
app.include_router(ocr_router)
app.include_router(sandbox_router)

# 4. Mount Public Chat Interface Static Export
CHAT_FRONTEND_OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chat-frontend", "out"))

if os.path.exists(CHAT_FRONTEND_OUT_DIR):
    app.mount("/", StaticFiles(directory=CHAT_FRONTEND_OUT_DIR, html=True), name="chat-static")
else:
    @app.get("/")
    async def root_fallback():
        return {
            "status": "MRPL_USER_BACKEND_RUNNING",
            "message": "Chat frontend static export build not detected at apps/chat-frontend/out. Run 'npm run build' in apps/chat-frontend/."
        }

if __name__ == "__main__":
    uvicorn.run(
        "apps.user_backend.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
