# models/domain.py

from datetime import datetime
from bson import ObjectId
from typing import Optional
from pydantic import BaseModel, HttpUrl, Field


class FounderProfile(BaseModel):
    name: str
    linkedin: Optional[HttpUrl] = None


class Metadata(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class DomainModel(BaseModel):
    id: Optional[str] = Field(alias="_id")
    domain: HttpUrl
    business_name: str
    location: Optional[str] = None
    industry: Optional[str] = None
    founder_profile: Optional[FounderProfile] = None
    metadata: Optional[Metadata] = None
    ai_tags: Optional[list[str]] = []
    scraped_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
