# models/user.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class User(BaseModel):
    """User model for database storage"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    session_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Business profile fields
    business_type: Optional[str] = None
    industry: Optional[str] = None
    product_service: Optional[str] = None
    target_audience: Optional[str] = None
    campaign_goal: Optional[str] = None
    onboarding_completed: bool = False

class OnboardingData(BaseModel):
    """Model for user business onboarding data"""
    business_type: str
    industry: str
    product_service: str
    target_audience: str
    campaign_goal: str

class SimpleAuthRequest(BaseModel):
    """Model for simple email/password authentication"""
    email: str
    password: Optional[str] = None
    name: Optional[str] = None