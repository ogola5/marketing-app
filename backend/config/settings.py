# # config/settings.py

# import os
# from pathlib import Path
# from dotenv import load_dotenv
# from pydantic_settings import BaseSettings
# from typing import Optional

# # Load environment variables
# ROOT_DIR = Path(__file__).parent.parent
# load_dotenv(ROOT_DIR / '.env')

# class Settings(BaseSettings):
#     # App Configuration
#     app_name: str = "AI Marketing Agent API"
#     app_version: str = "1.0.0"
#     debug: bool = os.environ.get("DEBUG", "False") == "True"

#     # Deployment Environment
#     environment: str = os.environ.get("ENV", "development")  # "development" or "production"

#     # Database Configuration
#     mongo_url: str = os.environ["MONGO_URL"]
#     db_name: str = os.environ["DB_NAME"]

#     # AI Service Configuration
#     gemini_api_key: Optional[str] = os.environ.get("GEMINI_API_KEY")
#     gemini_api_url: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

#     # Google OAuth Configuration
#     google_client_id: Optional[str] = os.environ.get("GOOGLE_CLIENT_ID")
#     google_client_secret: Optional[str] = os.environ.get("GOOGLE_CLIENT_SECRET")
    
#     google_redirect_uri: str = (
#         "https://marketing-app-1.onrender.com/api/auth/google/callback"
#         if os.environ.get("ENV") == "production"
#         else "http://localhost:8001/api/auth/google/callback"
#     )

#     # Email Configuration
#     sender_email: Optional[str] = os.environ.get("SENDER_EMAIL")
#     email_app_password: Optional[str] = os.environ.get("EMAIL_APP_PASSWORD")
#     smtp_server: str = "smtp.gmail.com"
#     smtp_port: int = 587

#     # Frontend Configuration
#     frontend_url: str = (
#         "https://vercel.com/ogola5s-projects/marketing-app"
#         if os.environ.get("ENV") == "production"
#         else "http://localhost:3000"
#     )

#     # CORS Configuration
#     allowed_origins: list = (
#         [
#             "https://vercel.com/ogola5s-projects/marketing-app",
#             "https://marketing-app-1.onrender.com",
#             "https://marketing-iylh2bkfu-ogola5s-projects.vercel.app"  # ADD THIS
#         ]
#         if os.environ.get("ENV") == "production"
#         else [
#             "http://localhost:3000",
#             "http://127.0.0.1:3000",
#             "http://localhost:3001",
#             "http://127.0.0.1:3001",
#         ]
#     )

#     # Server Configuration
#     host: str = "0.0.0.0"
#     port: int = 8001

#     # Hugging Face API Configuration
#     hf_token: Optional[str] = os.environ.get("HF_TOKEN")

#     class Config:
#         env_file = ".env"
#         case_sensitive = False

# settings = Settings()

# config/settings.py

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import List, Optional

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

class Settings(BaseSettings):
    # App Configuration
    app_name: str = "AI Marketing Agent API"
    app_version: str = "1.0.0"
    debug: bool = os.environ.get("DEBUG", "False") == "True"

    # Deployment Environment - MUST be set in production
    environment: str = os.environ.get("ENV", "production")  # Default to production for safety

    # Database Configuration
    mongo_url: str = os.environ["MONGO_URL"]
    db_name: str = os.environ["DB_NAME"]

    # AI Service Configuration
    gemini_api_key: Optional[str] = os.environ.get("GEMINI_API_KEY")
    gemini_api_url: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

    # Google OAuth Configuration - ALL from environment variables
    google_client_id: str = os.environ["GOOGLE_CLIENT_ID"]
    google_client_secret: str = os.environ["GOOGLE_CLIENT_SECRET"]
    google_redirect_uri: str = os.environ["GOOGLE_REDIRECT_URI"]  # Must be set in .env

    # Email Configuration
    sender_email: Optional[str] = os.environ.get("SENDER_EMAIL")
    email_app_password: Optional[str] = os.environ.get("EMAIL_APP_PASSWORD")
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587

    # Frontend Configuration
    frontend_url: str = os.environ["FRONTEND_URL"]  # Must be set in .env

    # CORS Configuration - Simplified and production-focused
    allowed_origins: List[str] = [
        "https://vercel.com/ogola5s-projects/marketing-app",
        "https://marketing-app-1.onrender.com",
        "https://marketing-iylh2bkfu-ogola5s-projects.vercel.app",
        os.environ.get("FRONTEND_URL", "")  # Fallback to FRONTEND_URL
    ]

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8001

    # Hugging Face API Configuration
    hf_token: Optional[str] = os.environ.get("HF_TOKEN")

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra env variables

settings = Settings()