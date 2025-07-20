# routes/auth.py
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from typing import Dict, Any
from datetime import datetime

from config import settings # Assuming 'settings' holds your frontend_url etc.
from models.user import User, OnboardingData, SimpleAuthRequest
from services.auth_service import AuthService

# --- Setup ---
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
auth_service = AuthService()
logger = logging.getLogger(__name__) # Use logger for routes

# --- Dependency for Authenticated Routes ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency to get the current user from a bearer token, now with expiration check."""
    logger.info(f"AuthRoutes: get_current_user dependency called. Token received: {credentials.credentials[:10]}...")
    user = await auth_service.get_user_by_token(credentials.credentials)
    if not user:
        logger.warning(f"AuthRoutes: get_current_user failed. Invalid or expired token: {credentials.credentials[:10]}...")
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
    logger.info(f"AuthRoutes: get_current_user successful. User: {user.email}")
    return user

# --- Google OAuth Endpoints ---
@router.get("/google/login", summary="Get Google OAuth URL")
async def google_login():
    """Generates and returns the Google OAuth URL with a state token for CSRF protection."""
    logger.info("AuthRoutes: /google/login endpoint hit.")
    auth_url = await auth_service.get_google_auth_url()
    logger.info(f"AuthRoutes: /google/login returning auth_url: {auth_url[:100]}...")
    return {"auth_url": auth_url}

@router.get("/google/callback", summary="Handle Google OAuth Callback")
async def google_callback(code: str = Query(...), state: str = Query(...)):
    """Handles the Google callback, passing code and state to the service for verification."""
    logger.info(f"AuthRoutes: /google/callback endpoint hit. Code: {code[:10]}..., State: {state}")
    try:
        result = await auth_service.handle_google_callback(code, state)
        # FIX: Changed redirect_url path to match frontend's AuthComponent expectation
        # Frontend AuthComponent's useEffect looks for 'token' in the URL after a redirect
        # on the path it was redirected to. If your frontend callback is /auth/google/callback,
        # then the backend should redirect to that same path.
        redirect_url = f"{settings.frontend_url}/auth/google/callback?token={result['token']}"
        logger.info(f"AuthRoutes: /google/callback successful. Redirecting to: {redirect_url[:100]}...")
        return RedirectResponse(url=redirect_url, status_code=307) # Use 307 for temporary redirect
    except HTTPException as e:
        logger.error(f"AuthRoutes: Google auth callback failed: {e.detail}. Redirecting to error URL.")
        return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?error={e.detail}", status_code=307) # Use 307 for consistency

# --- Simple Authentication Endpoints ---
@router.post("/register", summary="Register a new user", response_model=Dict[str, Any])
async def register(request: SimpleAuthRequest):
    """Registers a new user with email, name, and password."""
    logger.info(f"AuthRoutes: /register endpoint hit for email: {request.email}")
    if not request.name:
        logger.warning("AuthRoutes: Registration request missing name.")
        raise HTTPException(status_code=422, detail="Name is required for registration.")
    
    result = await auth_service.register_user(
        email=request.email, name=request.name, password=request.password
    )
    logger.info(f"AuthRoutes: /register successful for user {request.email}. Token: {result['token'][:10]}...")
    return {
        "user": result["user"],
        "token": result["token"],
        "message": "Registration successful",
    }

@router.post("/login", summary="Login a user", response_model=Dict[str, Any])
async def login(request: SimpleAuthRequest):
    """Logs in a user with their email and password."""
    logger.info(f"AuthRoutes: /login endpoint hit for email: {request.email}")
    result = await auth_service.login_user(email=request.email, password=request.password)
    logger.info(f"AuthRoutes: /login successful for user {request.email}. Token: {result['token'][:10]}...")
    return {
        "user": result["user"],
        "token": result["token"],
        "message": "Login successful",
    }

# --- Profile and Onboarding Endpoints ---
@router.get("/profile", summary="Get current user's profile", response_model=User)
async def get_profile(user: User = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    logger.info(f"AuthRoutes: /profile endpoint hit for user: {user.email}")
    return user

@router.put("/profile", summary="Update user profile")
async def update_profile(data: OnboardingData, user: User = Depends(get_current_user)):
    """Updates the profile information for the currently authenticated user."""
    logger.info(f"AuthRoutes: /profile (PUT) endpoint hit for user: {user.email}. Data: {data.dict()}")
    await auth_service.update_user(user_id=user.id, update_data=data.dict())
    logger.info(f"AuthRoutes: User {user.email} profile updated successfully.")
    return {"message": "Profile updated successfully"}

@router.post("/onboarding", summary="Complete user onboarding")
async def complete_onboarding(data: OnboardingData, user: User = Depends(get_current_user)):
    """Completes the onboarding process for the user, marking it as complete."""
    logger.info(f"AuthRoutes: /onboarding endpoint hit for user: {user.email}. Data: {data.dict()}")
    update_payload = data.dict()
    update_payload.update({
        "onboarding_completed": True,
        "onboarding_date": datetime.utcnow()
    })
    await auth_service.update_user(user_id=user.id, update_data=update_payload)
    logger.info(f"AuthRoutes: User {user.email} onboarding completed successfully.")
    return {"message": "Onboarding completed successfully"}