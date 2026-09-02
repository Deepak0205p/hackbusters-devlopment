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

from apps.admin_backend.api.routes_health import router as health_router
from apps.admin_backend.api.routes_models import router as models_router
from apps.admin_backend.api.routes_sovereignty import router as sovereignty_router
from apps.admin_backend.api.routes_rag_admin import router as rag_admin_router
from apps.admin_backend.api.routes_auth import router as auth_router

from apps.admin_backend.core.security_middleware import EnterpriseSecurityMiddleware

# 1. Instantiate Core FastAPI Application
app = FastAPI(
    title="MRPL Sovereign AI Workbench - Admin API",
    description="Admin-only API for model management, RAG ingestion, sovereignty monitoring, user management, and RBAC (SIH26117)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 2. Register Enterprise Security & CORS Middlewares
app.add_middleware(EnterpriseSecurityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(http://)?(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register Admin API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(models_router)
app.include_router(sovereignty_router)
app.include_router(rag_admin_router)

# 4. Mount Admin Observatory Static Export
ADMIN_FRONTEND_OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "admin-frontend", "out"))

if os.path.exists(ADMIN_FRONTEND_OUT_DIR):
    app.mount("/admin", StaticFiles(directory=ADMIN_FRONTEND_OUT_DIR, html=True), name="admin-static")
else:
    @app.get("/")
    async def root_fallback():
        return {
            "status": "MRPL_ADMIN_BACKEND_RUNNING",
            "message": "Admin frontend static export build not detected at apps/admin-frontend/out. Run 'npm run build' in apps/admin-frontend/."
        }

if __name__ == "__main__":
    uvicorn.run(
        "apps.admin_backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
