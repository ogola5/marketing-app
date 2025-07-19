# models/campaign.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class Campaign(BaseModel):
    """Campaign model for marketing campaigns"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    campaign_type: str  # email, social_media, direct_message
    content: str
    style: Optional[str] = "persuasive"
    status: str = "draft"  # draft, scheduled, sent, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_at: Optional[datetime] = None
    performance: dict = Field(default_factory=dict)

class CampaignRequest(BaseModel):
    """Model for campaign generation requests"""
    campaign_type: str  # email, social_media, direct_message
    style: Optional[str] = "persuasive"
    custom_prompt: Optional[str] = None

class EmailSendRequest(BaseModel):
    """Model for sending email campaigns"""
    recipients: List[str]