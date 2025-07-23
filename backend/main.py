

# from fastapi import FastAPI, APIRouter
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# from starlette.middleware.cors import CORSMiddleware
# import logging
# from pathlib import Path

# from config.settings import settings
# from config.database import connect_to_mongo, close_mongo_connection, create_indexes
# from routes.auth import router as auth_router
# from routes.campaigns import router as campaigns_router
# from routes.dashboard import router as dashboard_router
# from routes.domain import router as domain_router
# from routes.seo import router as seo_router
# from routes.system import router as system_router

# import os

# app = FastAPI(
#     title=settings.app_name,
#     version=settings.app_version,
#     description="AI-powered marketing campaign generator and management system",
#     docs_url="/docs",
#     redoc_url="/redoc"
# )

# # Register API routes
# api_router = APIRouter(prefix="/api")
# api_router.include_router(auth_router, tags=["Authentication"])
# api_router.include_router(campaigns_router, tags=["Campaigns"])
# api_router.include_router(dashboard_router, tags=["Dashboard"])
# api_router.include_router(domain_router, tags=["Domain"])
# api_router.include_router(seo_router, tags=["SEO"])
# api_router.include_router(system_router, tags=["System"])
# app.include_router(api_router)

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.allowed_origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.on_event("startup")
# async def startup_event():
#     logging.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")
#     try:
#         await connect_to_mongo()
#         await create_indexes()
#     except Exception as e:
#         logging.error(f"❌ Startup failed: {str(e)}")
#         raise

# @app.on_event("shutdown")
# async def shutdown_event():
#     try:
#         await close_mongo_connection()
#     except Exception as e:
#         logging.error(f"❌ Shutdown error: {str(e)}")

# @app.get("/")
# async def root():
#     return {
#         "name": settings.app_name,
#         "version": settings.app_version,
#         "status": "Running",
#         "docs": "/docs",
#         "redoc": "/redoc",
#         "api_prefix": "/api"
#     }

# # Only for local dev use
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
import logging
from pathlib import Path
import time

from config.settings import settings
from config.database import connect_to_mongo, close_mongo_connection, create_indexes
from routes.auth import router as auth_router
from routes.campaigns import router as campaigns_router
from routes.dashboard import router as dashboard_router
from routes.domain import router as domain_router
from routes.seo import router as seo_router
from routes.system import router as system_router

# Initialize logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO if settings.environment == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        # Add file handler for production
        *([logging.FileHandler("production.log")] if settings.environment == "production" else [])
    ]
)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered marketing campaign generator and management system",
    docs_url="/docs" if settings.debug else None,  # Disable docs in production
    redoc_url="/redoc" if settings.debug else None  # Disable redoc in production
)

# ===== Middleware Enhancements =====
# CORS - Production hardened
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    expose_headers=["X-Response-Time"]
)

# Add request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# ===== API Routes =====
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router, tags=["Authentication"])
api_router.include_router(campaigns_router, tags=["Campaigns"])
api_router.include_router(dashboard_router, tags=["Dashboard"])
api_router.include_router(domain_router, tags=["Domain"])
api_router.include_router(seo_router, tags=["SEO"])
api_router.include_router(system_router, tags=["System"])
app.include_router(api_router)

# ===== Event Handlers =====
@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version} in {settings.environment} mode")
    logger.info(f"🔒 Allowed Origins: {settings.allowed_origins}")
    logger.info(f"🔑 Using Google Redirect: {settings.google_redirect_uri}")
    
    try:
        await connect_to_mongo()
        logger.info("✅ Connected to MongoDB")
        await create_indexes()
        logger.info("✅ Created database indexes")
    except Exception as e:
        logger.critical(f"❌ MongoDB connection failed: {str(e)}")
        # Rethrow to prevent app from starting with bad DB connection
        raise

@app.on_event("shutdown")
async def shutdown_event():
    try:
        await close_mongo_connection()
        logger.info("✅ Closed MongoDB connection")
    except Exception as e:
        logger.error(f"⚠️ Error closing MongoDB connection: {str(e)}")

# ===== Global Error Handler =====
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"🚨 Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"},
    )

# ===== Health Check Endpoint =====
@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.environment}

# ===== Root Endpoint =====
@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment,
        "api": "/api",
        "health_check": "/health"
    }

# Only for local dev use
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=settings.host, 
        port=settings.port, 
        reload=settings.debug,
        # Production security settings
        proxy_headers=True,
        forwarded_allow_ips="*",
        timeout_keep_alive=30
    )