# services/auth_service.py
import httpx
import uuid
import logging
from typing import Dict, Any, Optional

from config import settings, db
from models import User

class AuthService:
    """Service for handling authentication operations"""
    
    def __init__(self):
        self.google_client_id = settings.google_client_id
        self.google_client_secret = settings.google_client_secret
        self.google_redirect_uri = settings.google_redirect_uri
        self.frontend_url = settings.frontend_url
        self.logger = logging.getLogger(__name__)
    
    def _validate_google_config(self) -> bool:
        """Validate Google OAuth configuration"""
        return all([
            self.google_client_id,
            self.google_client_secret,
            self.google_redirect_uri
        ])
    
    def get_google_auth_url(self) -> str:
        """Generate Google OAuth authorization URL"""
        if not self._validate_google_config():
            raise Exception("Google OAuth not configured")
        
        return (
            f"https://accounts.google.com/o/oauth2/auth"
            f"?client_id={self.google_client_id}"
            f"&redirect_uri={self.google_redirect_uri}"
            f"&scope=openid email profile"
            f"&response_type=code"
            f"&access_type=offline"
        )
    
    async def exchange_google_code_for_user_info(self, code: str) -> Dict[str, Any]:
        """Exchange Google OAuth code for user information"""
        try:
            if not self._validate_google_config():
                raise Exception("Google OAuth not configured")
            
            async with httpx.AsyncClient() as http_client:
                # Exchange code for tokens
                token_data = {
                    "client_id": self.google_client_id,
                    "client_secret": self.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.google_redirect_uri,
                }
                
                self.logger.info(f"Token exchange data: {token_data}")
                
                token_response = await http_client.post(
                    "https://oauth2.googleapis.com/token",
                    data=token_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                self.logger.info(f"Token response status: {token_response.status_code}")
                
                if token_response.status_code != 200:
                    self.logger.error(f"Token exchange failed: {token_response.text}")
                    raise Exception("Token exchange failed")
                
                tokens = token_response.json()
                access_token = tokens.get("access_token")
                
                if not access_token:
                    self.logger.error("No access token received")
                    raise Exception("No access token received")
                
                # Get user info
                user_response = await http_client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if user_response.status_code != 200:
                    self.logger.error(f"User info fetch failed: {user_response.text}")
                    raise Exception("User info fetch failed")
                
                user_info = user_response.json()
                self.logger.info(f"User info received: {user_info.get('email')}")
                
                return user_info
                
        except Exception as e:
            self.logger.error(f"Google OAuth error: {str(e)}")
            raise
    
    async def create_or_update_user_from_google(self, user_info: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update user from Google OAuth user info"""
        try:
            email = user_info["email"]
            name = user_info["name"]
            picture = user_info.get("picture")
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": email})
            
            if existing_user:
                # Update session token for existing user
                session_token = str(uuid.uuid4())
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"session_token": session_token}}
                )
                user_data = User(**existing_user)
                user_data.session_token = session_token
            else:
                # Create new user
                session_token = str(uuid.uuid4())
                user_data = User(
                    email=email,
                    name=name,
                    picture=picture,
                    session_token=session_token
                )
                await db.users.insert_one(user_data.dict())
            
            return {
                "user": user_data.dict(),
                "session_token": session_token,
                "redirect_url": self._build_frontend_redirect_url(user_info, session_token)
            }
            
        except Exception as e:
            self.logger.error(f"User creation/update error: {str(e)}")
            raise
    
    def _build_frontend_redirect_url(self, user_info: Dict[str, Any], session_token: str) -> str:
        """Build frontend redirect URL with auth data"""
        frontend_url = f"{self.frontend_url}?token={session_token}&user={user_info['email']}&name={user_info['name']}"
        if user_info.get('picture'):
            frontend_url += f"&picture={user_info['picture']}"
        return frontend_url
    
    async def simple_register(self, email: str, name: str, password: Optional[str] = None) -> Dict[str, Any]:
        """Simple email/name registration"""
        try:
            if not all([email, name]):
                raise ValueError("Email and name are required")
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": email})
            if existing_user:
                raise ValueError("User already exists")
            
            # Create new user
            session_token = str(uuid.uuid4())
            user_data = User(
                email=email,
                name=name,
                session_token=session_token
            )
            await db.users.insert_one(user_data.dict())
            
            return {
                "user": user_data.dict(),
                "token": session_token,
                "message": "Registration successful"
            }
            
        except ValueError:
            raise
        except Exception as e:
            self.logger.error(f"Registration error: {str(e)}")
            raise Exception("Registration failed")
    
    async def simple_login(self, email: str) -> Dict[str, Any]:
        """Simple email login"""
        try:
            # Find user
            user = await db.users.find_one({"email": email})
            if not user:
                raise ValueError("Invalid credentials")
            
            # Generate new session token
            session_token = str(uuid.uuid4())
            await db.users.update_one(
                {"email": email},
                {"$set": {"session_token": session_token}}
            )
            
            user_data = User(**user)
            user_data.session_token = session_token
            
            return {
                "user": user_data.dict(),
                "token": session_token,
                "message": "Login successful"
            }
            
        except ValueError:
            raise
        except Exception as e:
            self.logger.error(f"Login error: {str(e)}")
            raise Exception("Login failed")
    
    async def get_user_by_token(self, token: str) -> Optional[User]:
        """Get user by session token"""
        try:
            user = await db.users.find_one({"session_token": token})
            if not user:
                return None
            return User(**user)
        except Exception as e:
            self.logger.error(f"Get user by token error: {str(e)}")
            return None
    
    async def logout_user(self, token: str) -> bool:
        """Logout user by clearing session token"""
        try:
            result = await db.users.update_one(
                {"session_token": token},
                {"$unset": {"session_token": ""}}
            )
            return result.modified_count > 0
        except Exception as e:
            self.logger.error(f"Logout error: {str(e)}")
            return False
    
    def get_google_oauth_debug_info(self) -> Dict[str, Any]:
        """Get Google OAuth configuration for debugging"""
        return {
            "configured": self._validate_google_config(),
            "client_id": self.google_client_id,
            "redirect_uri": self.google_redirect_uri,
            "full_auth_url": self.get_google_auth_url() if self._validate_google_config() else None
        }