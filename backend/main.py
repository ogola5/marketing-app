

from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
import logging
from pathlib import Path

from config.settings import settings
from config.database import connect_to_mongo, close_mongo_connection, create_indexes
from routes.auth import router as auth_router
from routes.campaigns import router as campaigns_router
from routes.dashboard import router as dashboard_router
from routes.domain import router as domain_router
from routes.seo import router as seo_router
from routes.system import router as system_router

import os

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered marketing campaign generator and management system",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Register API routes
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router, tags=["Authentication"])
api_router.include_router(campaigns_router, tags=["Campaigns"])
api_router.include_router(dashboard_router, tags=["Dashboard"])
api_router.include_router(domain_router, tags=["Domain"])
api_router.include_router(seo_router, tags=["SEO"])
api_router.include_router(system_router, tags=["System"])
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Frontend Serving
# frontend_path = Path(__file__).resolve().parent.parent / "frontend" / "build"
# if frontend_path.exists():
#     app.mount("/static", StaticFiles(directory=frontend_path / "static"), name="static")

#     @app.get("/{full_path:path}")
#     async def serve_react_app(full_path: str):
#         index_file = frontend_path / "index.html"
#         if index_file.exists():
#             return FileResponse(index_file)
#         return {"detail": "Frontend build not found"}
# else:
#     logging.warning("⚠️ Frontend build directory not found. Skipping static file serving.")
# Serve static files (React build)
# app.mount("/static", StaticFiles(directory="frontend_build/static"), name="static")

# # Serve the index.html for all frontend routes
# @app.get("/{full_path:path}")
# async def serve_react_app(full_path: str):
#     index_path = os.path.join("frontend_build", "index.html")
#     if os.path.exists(index_path):
#         return FileResponse(index_path)
#     return {"error": "index.html not found"}
# Events
@app.on_event("startup")
async def startup_event():
    logging.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    try:
        await connect_to_mongo()
        await create_indexes()
    except Exception as e:
        logging.error(f"❌ Startup failed: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    try:
        await close_mongo_connection()
    except Exception as e:
        logging.error(f"❌ Shutdown error: {str(e)}")

@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "Running",
        "docs": "/docs",
        "redoc": "/redoc",
        "api_prefix": "/api"
    }

# Only for local dev use
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
