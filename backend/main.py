# main.py
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import logging
import uvicorn

# Import our organized modules
from config import settings, connect_to_mongo, close_mongo_connection, create_indexes
from routes import (
    auth_router, 
    campaigns_router, 
    leads_router, 
    dashboard_router, 
    system_router
)

# Create the main FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered marketing campaign generator and management system",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Create API router with prefix
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth_router, tags=["Authentication"])
api_router.include_router(campaigns_router, tags=["Campaigns"]) 
api_router.include_router(leads_router, tags=["Leads"])
api_router.include_router(dashboard_router, tags=["Dashboard"])
api_router.include_router(system_router, tags=["System"])

# Include the main API router in the app
app.include_router(api_router)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Application startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    
    try:
        # Connect to database
        await connect_to_mongo()
        logger.info("✅ Database connection established")
        
        # Create database indexes for better performance
        await create_indexes()
        logger.info("✅ Database indexes created")
        
        # Log configuration status
        logger.info(f"📊 Database: {settings.db_name}")
        logger.info(f"🤖 Gemini AI: {'✅ Configured' if settings.gemini_api_key else '❌ Not configured'}")
        logger.info(f"🔐 Google OAuth: {'✅ Configured' if settings.google_client_id else '❌ Not configured'}")
        logger.info(f"📧 Email Service: {'✅ Configured' if settings.sender_email else '❌ Not configured'}")
        logger.info(f"🌐 CORS Origins: {', '.join(settings.allowed_origins)}")
        logger.info(f"🏃 Server running on {settings.host}:{settings.port}")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise

# Application shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("🛑 Shutting down application...")
    
    try:
        # Close database connection
        await close_mongo_connection()
        logger.info("✅ Database connection closed")
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {str(e)}")
    
    logger.info("✅ Application shutdown complete")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
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
            "leads": "/api/leads/*",
            "dashboard": "/api/dashboard"
        }
    }

# Development server entry point
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,  # Enable auto-reload in development
        log_level="info"
    )