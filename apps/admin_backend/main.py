import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apps.admin_backend.api.routes_health import router as health_router
from apps.admin_backend.api.routes_models import router as models_router
from apps.admin_backend.api.routes_sovereignty import router as sovereignty_router
from apps.admin_backend.api.routes_chat import router as chat_router
from apps.admin_backend.api.routes_upload import router as upload_router
from apps.admin_backend.api.routes_files import router as files_router
from apps.admin_backend.api.routes_rag_admin import router as rag_admin_router

# 1. Instantiate Core FastAPI Application
app = FastAPI(
    title="MRPL Sovereign AI Workbench Gateway",
    description="On-premise air-gapped agentic AI API server for refinery operations (SIH26117)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 2. Configure LAN / Hotspot Multi-Device Private CORS
# Allows private RFC 1918 subnets (127.0.0.1, 192.168.*, 10.*, 172.*) for remote evaluator devices
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(http://)?(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register Core API Routers
app.include_router(health_router)
app.include_router(models_router)
app.include_router(sovereignty_router)
app.include_router(chat_router)
app.include_router(upload_router)
app.include_router(files_router)
app.include_router(rag_admin_router)

# 4. Mount Dual Next.js Static Export Bundles
CHAT_FRONTEND_OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chat-frontend", "out"))
ADMIN_FRONTEND_OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "admin-frontend", "out"))

# Mount Admin Observatory at /admin
if os.path.exists(ADMIN_FRONTEND_OUT_DIR):
    app.mount("/admin", StaticFiles(directory=ADMIN_FRONTEND_OUT_DIR, html=True), name="admin-static")

# Mount Public Chat Interface at /
if os.path.exists(CHAT_FRONTEND_OUT_DIR):
    app.mount("/", StaticFiles(directory=CHAT_FRONTEND_OUT_DIR, html=True), name="chat-static")
else:
    @app.get("/")
    async def root_fallback():
        return {
            "status": "MRPL_BACKEND_RUNNING",
            "message": "Chat frontend static export build not detected at apps/chat-frontend/out. Run 'npm run build' in apps/chat-frontend/."
        }

if __name__ == "__main__":
    uvicorn.run(
        "apps.admin_backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
