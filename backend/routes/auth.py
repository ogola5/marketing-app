# routes/auth.py
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import uuid
import logging

from config import settings, db
from models import User, OnboardingData, SimpleAuthRequest

router = APIRouter()
security = HTTPBearer()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = await db.users.find_one({"session_token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return User(**user)

# DEBUG ENDPOINT
@router.get("/debug/google-config")
async def debug_google_config():
    """Debug endpoint to check Google OAuth configuration"""
    return {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "full_auth_url": (
            f"https://accounts.google.com/o/oauth2/auth"
            f"?client_id={settings.google_client_id}"
            f"&redirect_uri={settings.google_redirect_uri}"
            f"&scope=openid email profile"
            f"&response_type=code"
            f"&access_type=offline"
        )
    }

# Google OAuth endpoints
@router.get("/auth/google/login")
async def google_login():
    """Redirect to Google OAuth"""
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&scope=openid email profile"
        f"&response_type=code"
        f"&access_type=offline"
    )
    
    logging.info(f"Google OAuth URL: {google_auth_url}")
    logging.info(f"Redirect URI: {settings.google_redirect_uri}")
    
    return {"auth_url": google_auth_url}

@router.get("/auth/google/callback")
async def google_callback(code: str = Query(..., description="OAuth authorization code")):
    """Handle Google OAuth callback"""
    try:
        logging.info(f"Processing callback with redirect_uri: {settings.google_redirect_uri}")
        
        if not all([settings.google_client_id, settings.google_client_secret]):
            raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
        async with httpx.AsyncClient() as http_client:
            # Exchange code for tokens
            token_data = {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            }
            
            logging.info(f"Token exchange data: {token_data}")
            
            token_response = await http_client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            logging.info(f"Token response status: {token_response.status_code}")
            
            if token_response.status_code != 200:
                logging.error(f"Token exchange failed: {token_response.text}")
                return RedirectResponse(url=f"{settings.frontend_url}?error=auth_failed")
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            if not access_token:
                logging.error("No access token received")
                return RedirectResponse(url=f"{settings.frontend_url}?error=no_token")
            
            # Get user info
            user_response = await http_client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                logging.error(f"User info fetch failed: {user_response.text}")
                return RedirectResponse(url=f"{settings.frontend_url}?error=user_info_failed")
            
            user_info = user_response.json()
            logging.info(f"User info received: {user_info.get('email')}")
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": user_info["email"]})
            
            if existing_user:
                # Update session token
                session_token = str(uuid.uuid4())
                await db.users.update_one(
                    {"email": user_info["email"]},
                    {"$set": {"session_token": session_token}}
                )
                user_data = User(**existing_user)
                user_data.session_token = session_token
            else:
                # Create new user
                session_token = str(uuid.uuid4())
                user_data = User(
                    email=user_info["email"],
                    name=user_info["name"],
                    picture=user_info.get("picture"),
                    session_token=session_token
                )
                await db.users.insert_one(user_data.dict())
            
            # Redirect back to frontend with auth data
            frontend_url = f"{settings.frontend_url}?token={session_token}&user={user_info['email']}&name={user_info['name']}"
            if user_info.get('picture'):
                frontend_url += f"&picture={user_info['picture']}"
            
            return RedirectResponse(url=frontend_url)
            
    except HTTPException:
        return RedirectResponse(url=f"{settings.frontend_url}?error=auth_failed")
    except Exception as e:
        logging.error(f"Google OAuth error: {str(e)}")
        return RedirectResponse(url=f"{settings.frontend_url}?error=auth_failed")

# Simple authentication endpoints
@router.post("/auth/register")
async def register(request: SimpleAuthRequest):
    """Simple registration endpoint"""
    try:
        if not all([request.email, request.name]):
            raise HTTPException(status_code=400, detail="Email and name are required")
            
        # Check if user exists
        existing_user = await db.users.find_one({"email": request.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create new user
        session_token = str(uuid.uuid4())
        user_data = User(
            email=request.email,
            name=request.name,
            session_token=session_token
        )
        await db.users.insert_one(user_data.dict())
        
        return {
            "user": user_data.dict(),
            "token": session_token,
            "message": "Registration successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/auth/login")
async def login(request: SimpleAuthRequest):
    """Simple login endpoint"""
    try:
        # Find user
        user = await db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate new session token
        session_token = str(uuid.uuid4())
        await db.users.update_one(
            {"email": request.email},
            {"$set": {"session_token": session_token}}
        )
        
        user_data = User(**user)
        user_data.session_token = session_token
        
        return {
            "user": user_data.dict(),
            "token": session_token,
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

# Profile and onboarding
@router.post("/onboarding")
async def complete_onboarding(data: OnboardingData, user: User = Depends(get_current_user)):
    """Complete user onboarding"""
    try:
        await db.users.update_one(
            {"id": user.id},
            {
                "$set": {
                    "business_type": data.business_type,
                    "industry": data.industry,
                    "product_service": data.product_service,
                    "target_audience": data.target_audience,
                    "campaign_goal": data.campaign_goal,
                    "onboarding_completed": True
                }
            }
        )
        
        return {"message": "Onboarding completed successfully"}
    except Exception as e:
        logging.error(f"Onboarding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save onboarding data")

@router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    """Get user profile"""
    user_data = await db.users.find_one({"id": user.id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_data)

@router.put("/profile")
async def update_profile(data: OnboardingData, user: User = Depends(get_current_user)):
    """Update user profile"""
    try:
        await db.users.update_one(
            {"id": user.id},
            {
                "$set": {
                    "business_type": data.business_type,
                    "industry": data.industry,
                    "product_service": data.product_service,
                    "target_audience": data.target_audience,
                    "campaign_goal": data.campaign_goal
                }
            }
        )
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logging.error(f"Update profile error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")