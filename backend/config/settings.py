# config/settings.py
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

class Settings(BaseSettings):
    # App Configuration
    app_name: str = "AI Marketing Agent API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database Configuration
    mongo_url: str = os.environ['MONGO_URL']
    db_name: str = os.environ['DB_NAME']
    
    # AI Service Configuration
    gemini_api_key: Optional[str] = os.environ.get('GEMINI_API_KEY')
    gemini_api_url: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
    
    # Google OAuth Configuration
    google_client_id: Optional[str] = os.environ.get("GOOGLE_CLIENT_ID")
    google_client_secret: Optional[str] = os.environ.get("GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = "https://marketing-app-1.onrender.com/api/auth/google/callback"
    
    # Email Configuration
    sender_email: Optional[str] = os.environ.get("SENDER_EMAIL")
    email_app_password: Optional[str] = os.environ.get("EMAIL_APP_PASSWORD")
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    
    # Frontend Configuration
    frontend_url: str = "https://marketing-app-mu.vercel.app/"
    
    # CORS Configuration
    allowed_origins: list = [
        "https://marketing-app-mu.vercel.app/",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8001
    
    # Hugging Face API Configuration
    hf_token: Optional[str] = os.environ.get("HF_TOKEN")  # Added to support utils/hf_api.py

    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()