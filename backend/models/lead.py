# models/lead.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Lead(BaseModel):
    """Lead model for tracking campaign leads"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    campaign_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    interaction_type: str  # opened, clicked, replied, sent
    status: str = "cold"  # cold, warm, hot
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class LeadStatusUpdate(BaseModel):
    """Model for updating lead status"""
    status: str