
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
import logging
import uvicorn
import os
from pathlib import Path

# Import modules based on updated structure
from config.settings import settings
from config.database import connect_to_mongo, close_mongo_connection, create_indexes
from routes.auth import router as auth_router
from routes.campaigns import router as campaigns_router
from routes.dashboard import router as dashboard_router
from routes.domain import router as domain_router
from routes.seo import router as seo_router
from routes.system import router as system_router

# Create the main FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered marketing campaign generator and management system",
    docs_url="/docs",
    redoc_url="/redoc"
)

# API Router
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router, tags=["Authentication"])
api_router.include_router(campaigns_router, tags=["Campaigns"])
api_router.include_router(dashboard_router, tags=["Dashboard"])
api_router.include_router(domain_router, tags=["Domain"])
api_router.include_router(seo_router, tags=["SEO"])
api_router.include_router(system_router, tags=["System"])
app.include_router(api_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static frontend files
frontend_path = Path(__file__).resolve().parent.parent / "frontend" / "build"

if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_path, "static")), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index_file = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"detail": "Frontend not found"}
else:
    logging.warning("⚠️ Frontend build directory not found. Skipping static file serving.")

# Logging config
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    try:
        await connect_to_mongo()
        logger.info("✅ Database connection established")
        await create_indexes()
        logger.info("✅ Database indexes created")
        logger.info(f"📊 Database: {settings.db_name}")
        logger.info(f"🤖 Gemini AI: {'✅' if settings.gemini_api_key else '❌'}")
        logger.info(f"🔐 Google OAuth: {'✅' if settings.google_client_id else '❌'}")
        logger.info(f"📧 Email Service: {'✅' if settings.sender_email else '❌'}")
        logger.info(f"🌐 CORS Origins: {', '.join(settings.allowed_origins)}")
        logger.info(f"🏃 Server running on {settings.host}:{settings.port}")
        logger.info(f"🤖 HF API: {'✅' if settings.hf_token else '❌'}")
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Shutting down application...")
    try:
        await close_mongo_connection()
        logger.info("✅ Database connection closed")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {str(e)}")
    logger.info("✅ Application shutdown complete")

@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "🚀 Running",
        "docs": "/docs",
        "redoc": "/redoc",
        "api_prefix": "/api",
        "endpoints": {
            "health": "/api/health",
            "auth": "/api/auth/*",
            "campaigns": "/api/campaigns/*",
            "dashboard": "/api/dashboard/*",
            "domain": "/api/domain/*",
            "seo": "/api/seo/*",
            "system": "/api/system/*"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info"
    )
