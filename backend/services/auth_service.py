# services/auth_service.py
import httpx
import uuid
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

from fastapi import HTTPException

# --- ADD THESE IMPORTS ---
from models.user import User # <--- ADD THIS LINE
# If you use OnboardingData or SimpleAuthRequest directly in auth_service.py
# (which you don't seem to at the module level in this snippet, but might in other functions),
# you'd add them here too:
# from models.user import User, OnboardingData, SimpleAuthRequest
# -------------------------

# Assumes you have a security utility for hashing passwords
# You would need to create this file, e.g., using passlib
# from utils.security import hash_password, verify_password
# For demonstration, placeholder functions are used here.
def hash_password(password: str) -> str:
    # In a real app, use: from passlib.context import CryptContext
    # pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # return pwd_context.hash(password)
    logging.info(f"AuthService: Hashing password (placeholder): {password[:3]}...")
    return f"hashed_{password}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # In a real app, use: pwd_context.verify(plain_password, hashed_password)
    logging.info(f"AuthService: Verifying password (placeholder). Plain: {plain_password[:3]}..., Hashed: {hashed_password[:3]}...")
    return hashed_password == f"hashed_{plain_password}"


from config import settings, db # Assuming 'db' is your MongoDB client and 'settings' holds configs

class AuthService:
    """Service for handling all authentication and user profile operations."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # Session token is valid for 30 days
        self.SESSION_EXPIRATION_DELTA = timedelta(days=30)
        self.logger.info("AuthService: Initialized.")

    async def get_google_auth_url(self) -> str:
        """
        Generates the Google OAuth URL with a state token for CSRF protection.
        """
        self.logger.info("AuthService: Generating Google OAuth URL...")
        if not all([settings.google_client_id, settings.google_redirect_uri]):
            self.logger.error("AuthService: Google OAuth is not configured. Missing client_id or redirect_uri.")
            raise HTTPException(status_code=500, detail="Google OAuth is not configured")

        # 1. Create state for CSRF protection
        state = str(uuid.uuid4())
        state_expires = datetime.utcnow() + timedelta(minutes=10) # State is valid for 10 minutes
        self.logger.info(f"AuthService: Generated CSRF state: {state}, expires at: {state_expires}")

        # 2. Store state in the database
        try:
            await db.oauth_states.insert_one({"state": state, "expires_at": state_expires})
            self.logger.info(f"AuthService: Stored state {state} in DB.")
        except Exception as e:
            self.logger.error(f"AuthService: Failed to store OAuth state in DB: {e}")
            raise HTTPException(status_code=500, detail="Failed to store OAuth state.")


        # 3. Build URL
        auth_url = (
            f"https://accounts.google.com/o/oauth2/auth"
            f"?client_id={settings.google_client_id}"
            f"&redirect_uri={settings.google_redirect_uri}"
            f"&scope=openid email profile"
            f"&response_type=code"
            f"&access_type=offline"
            f"&prompt=consent"
            f"&state={state}" # Added state for CSRF
        )
        self.logger.info(f"AuthService: Generated Google auth_url: {auth_url[:100]}...")
        return auth_url

    async def handle_google_callback(self, code: str, state: str) -> Dict[str, Any]:
        """Orchestrates the Google callback, verifying state and managing the user session."""
        self.logger.info(f"AuthService: Handling Google callback. Code: {code[:10]}..., State: {state}")
        # 1. Verify CSRF state token
        state_doc = await db.oauth_states.find_one_and_delete({"state": state})
        if not state_doc:
            self.logger.error(f"AuthService: Invalid or expired state token for state: {state}. CSRF attack suspected.")
            raise HTTPException(status_code=400, detail="Invalid or expired state token. CSRF attack suspected.")
        self.logger.info(f"AuthService: CSRF state {state} verified and deleted from DB.")

        # 2. Exchange code for user info
        user_info = await self._exchange_code_for_user_info(code)
        self.logger.info(f"AuthService: User info from Google received. Email: {user_info.get('email')}")
        user, session_token = await self._create_or_update_user_from_provider(user_info)
        self.logger.info(f"AuthService: User created/updated. Session token generated: {session_token[:10]}...")
        return {"user": user, "token": session_token}

    async def _exchange_code_for_user_info(self, code: str) -> Dict[str, Any]:
        """Exchanges a Google OAuth code for user information."""
        self.logger.info(f"AuthService: Exchanging Google OAuth code for user info. Code: {code[:10]}...")
        token_data = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.google_redirect_uri,
        }
        async with httpx.AsyncClient() as client:
            try:
                token_response = await client.post("https://oauth2.googleapis.com/token", data=token_data)
                token_response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
                self.logger.info(f"AuthService: Google token exchange successful. Status: {token_response.status_code}")
            except httpx.HTTPStatusError as e:
                self.logger.error(f"AuthService: Google token exchange failed with HTTP error: {e.response.status_code} - {e.response.text}")
                raise HTTPException(status_code=400, detail=f"Invalid OAuth code or redirect URI mismatch: {e.response.text}")
            except httpx.RequestError as e:
                self.logger.error(f"AuthService: Google token exchange failed with request error: {e}")
                raise HTTPException(status_code=500, detail=f"Network error during Google token exchange: {e}")
            
            access_token = token_response.json().get("access_token")
            if not access_token:
                self.logger.error("AuthService: No access_token received from Google token exchange.")
                raise HTTPException(status_code=500, detail="Failed to get access token from Google.")

            self.logger.info("AuthService: Fetching user info from Google...")
            try:
                user_response = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                user_response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
                self.logger.info(f"AuthService: User info fetched from Google successful. Status: {user_response.status_code}")
            except httpx.HTTPStatusError as e:
                self.logger.error(f"AuthService: Failed to fetch user info from Google with HTTP error: {e.response.status_code} - {e.response.text}")
                raise HTTPException(status_code=500, detail=f"Failed to fetch user information from Google: {e.response.text}")
            except httpx.RequestError as e:
                self.logger.error(f"AuthService: Failed to fetch user info from Google with request error: {e}")
                raise HTTPException(status_code=500, detail=f"Network error during Google user info fetch: {e}")
            
            return user_response.json()

    async def _create_or_update_user_from_provider(self, user_info: Dict[str, Any]) -> Tuple[User, str]:
        """Creates a new user or updates an existing one from Google, aligning with the new User model."""
        email = user_info.get("email")
        self.logger.info(f"AuthService: Creating/updating user from provider. Email: {email}")
        if not email:
            self.logger.error("AuthService: Email not provided by OAuth provider.")
            raise HTTPException(status_code=400, detail="Email not provided by OAuth provider.")

        session_token = str(uuid.uuid4())
        token_expires_at = datetime.utcnow() + self.SESSION_EXPIRATION_DELTA
        
        user_doc = await db.users.find_one({"email": email})
        
        if user_doc:
            self.logger.info(f"AuthService: User with email {email} found. Updating session.")
            # Update existing user's session token and last login
            update_data = {
                "$set": {
                    "session_token": session_token,
                    "token_expires_at": token_expires_at,
                    "last_login": datetime.utcnow()
                }
            }
            # Query by 'id' field as defined in the model
            await db.users.update_one({"id": user_doc["id"]}, update_data)
            user_doc.update(update_data["$set"]) # Update the local doc to reflect changes
            self.logger.info(f"AuthService: User {user_doc['id']} updated. New session token: {session_token[:10]}...")
            return User(**user_doc), session_token
        else:
            self.logger.info(f"AuthService: No user with email {email} found. Creating new user.")
            # Create a new user with all required fields
            new_user = User(
                email=email,
                name=user_info.get("name"),
                picture=user_info.get("picture"),
                session_token=session_token,
                token_expires_at=token_expires_at,
                last_login=datetime.utcnow(),
                auth_provider="google" # Set auth provider
            )
            # Use the model's dict() method to ensure all defaults are included
            await db.users.insert_one(new_user.dict())
            self.logger.info(f"AuthService: New user {new_user.id} created. Session token: {session_token[:10]}...")
            return new_user, session_token

    async def register_user(self, email: str, name: str, password: str) -> Dict[str, Any]:
        """Registers a new user with email and a hashed password."""
        self.logger.info(f"AuthService: Attempting to register user: {email}")
        if await db.users.find_one({"email": email}):
            self.logger.warning(f"AuthService: Registration failed. User with email {email} already exists.")
            raise HTTPException(status_code=409, detail="User with this email already exists.")
            
        session_token = str(uuid.uuid4())
        token_expires_at = datetime.utcnow() + self.SESSION_EXPIRATION_DELTA
        
        new_user = User(
            email=email,
            name=name,
            password_hash=hash_password(password), # Store hashed password
            session_token=session_token,
            token_expires_at=token_expires_at,
            last_login=datetime.utcnow(),
            auth_provider="email" # Set auth provider
        )
        
        await db.users.insert_one(new_user.dict())
        self.logger.info(f"AuthService: User {new_user.id} registered successfully with email. Session token: {session_token[:10]}...")
        return {"user": new_user, "token": session_token}

    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Logs in a user by verifying their password and provides a new session token."""
        self.logger.info(f"AuthService: Attempting to log in user: {email}")
        user_doc = await db.users.find_one({"email": email})
        if not user_doc:
            self.logger.warning(f"AuthService: Login failed for {email}. User not found.")
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        if not user_doc.get("password_hash"):
            self.logger.warning(f"AuthService: Login failed for {email}. User has no password_hash (e.g., Google user).")
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if not verify_password(password, user_doc["password_hash"]):
            self.logger.warning(f"AuthService: Login failed for {email}. Password mismatch.")
            raise HTTPException(status_code=401, detail="Invalid email or password.")
            
        session_token = str(uuid.uuid4())
        token_expires_at = datetime.utcnow() + self.SESSION_EXPIRATION_DELTA
        
        update_data = {
            "$set": {
                "session_token": session_token,
                "token_expires_at": token_expires_at,
                "last_login": datetime.utcnow()
            }
        }
        await db.users.update_one({"id": user_doc["id"]}, update_data)
        user_doc.update(update_data["$set"]) # Update local doc for return
        self.logger.info(f"AuthService: User {user_doc['id']} logged in successfully. Session token: {session_token[:10]}...")
        
        return {"user": User(**user_doc), "token": session_token}

    async def get_user_by_token(self, token: str) -> Optional[User]:
        """Retrieves a user by their session token, checking for expiration."""
        self.logger.info(f"AuthService: Attempting to get user by token: {token[:10]}...")
        user_doc = await db.users.find_one({"session_token": token})
        if not user_doc:
            self.logger.info(f"AuthService: No user found for token: {token[:10]}...")
            return None
        
        # Check if token is expired
        if user_doc.get("token_expires_at") and datetime.utcnow() > user_doc["token_expires_at"]:
            self.logger.warning(f"AuthService: Token for user {user_doc.get('email')} is expired. Clearing token.")
            # Optionally clear the expired token from DB
            await db.users.update_one({"id": user_doc["id"]}, {"$unset": {"session_token": "", "token_expires_at": ""}})
            return None
        self.logger.info(f"AuthService: User {user_doc.get('email')} found for token: {token[:10]}...")
        return User(**user_doc)

    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """A generic method to update user fields."""
        self.logger.info(f"AuthService: Attempting to update user {user_id} with data: {update_data}")
        try:
            update_result = await db.users.update_one(
                {"id": user_id},
                {"$set": update_data}
            )
            if update_result.modified_count > 0:
                self.logger.info(f"AuthService: User {user_id} updated successfully. Modified count: {update_result.modified_count}")
            else:
                self.logger.info(f"AuthService: User {user_id} update attempted, but no changes made. Matched count: {update_result.matched_count}")
            return update_result.modified_count > 0
        except Exception as e:
            self.logger.error(f"AuthService: Error updating user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update user.")