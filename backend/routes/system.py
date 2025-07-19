# routes/system.py
from fastapi import APIRouter
from config import settings, db

router = APIRouter()

# Basic endpoints
@router.get("/")
async def root():
    return {"message": "AI Marketing Agent API", "status": "active", "version": "1.0.0"}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        await db.users.find_one({})
        
        # Test Gemini API
        gemini_status = "configured" if settings.gemini_api_key else "not configured"
        
        # Check Google OAuth
        google_oauth_status = "configured" if all([
            settings.google_client_id,
            settings.google_client_secret
        ]) else "not configured"
        
        return {
            "status": "healthy", 
            "database": "connected",
            "gemini_api": gemini_status,
            "google_oauth": google_oauth_status,
            "cors": "enabled"
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# CORS preflight handler
@router.options("/{path:path}")
async def options_handler():
    return {"message": "OK"}