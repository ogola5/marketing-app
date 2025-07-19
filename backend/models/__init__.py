# models/__init__.py
from .user import User, OnboardingData, SimpleAuthRequest
from .campaign import Campaign, CampaignRequest, EmailSendRequest
from .lead import Lead, LeadStatusUpdate

__all__ = [
    # User models
    "User",
    "OnboardingData", 
    "SimpleAuthRequest",
    
    # Campaign models
    "Campaign",
    "CampaignRequest",
    "EmailSendRequest",
    
    # Lead models
    "Lead",
    "LeadStatusUpdate"
]