# services/campaign_service.py
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from config import db
from models import Campaign, User
from .ai_service import AIService

class CampaignService:
    """Service for campaign-related business logic"""
    
    def __init__(self):
        self.ai_service = AIService()
        self.logger = logging.getLogger(__name__)
    
    async def generate_campaign(self, user: User, campaign_type: str, style: str = "persuasive", custom_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generate a new AI-powered campaign"""
        try:
            if not user.onboarding_completed:
                raise ValueError("Please complete onboarding first")
            
            # Get user business details
            user_data = await db.users.find_one({"id": user.id})
            if not user_data:
                raise ValueError("User not found")
            
            # Generate campaign content using AI service
            content = await self.ai_service.generate_campaign_content(
                user_data=user_data,
                campaign_type=campaign_type,
                style=style,
                custom_prompt=custom_prompt
            )
            
            # Create campaign record
            campaign = Campaign(
                user_id=user.id,
                title=f"{campaign_type.replace('_', ' ').title()} Campaign - {datetime.now().strftime('%Y-%m-%d')}",
                campaign_type=campaign_type,
                content=content,
                style=style,
                status="draft"
            )
            
            # Save to database
            await db.campaigns.insert_one(campaign.dict())
            
            return {
                "success": True,
                "campaign": campaign.dict(),
                "message": "Campaign generated successfully"
            }
            
        except ValueError as e:
            self.logger.error(f"Campaign generation validation error: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Campaign generation error: {str(e)}")
            raise Exception(f"Failed to generate campaign: {str(e)}")
    
    async def get_user_campaigns(self, user_id: str, limit: int = 1000) -> List[Campaign]:
        """Get all campaigns for a user"""
        try:
            campaigns = await db.campaigns.find({"user_id": user_id}).sort("created_at", -1).limit(limit).to_list(limit)
            return [Campaign(**campaign) for campaign in campaigns]
        except Exception as e:
            self.logger.error(f"Get campaigns error: {str(e)}")
            raise Exception("Failed to fetch campaigns")
    
    async def get_campaign_by_id(self, campaign_id: str, user_id: str) -> Optional[Campaign]:
        """Get specific campaign by ID for user"""
        try:
            campaign = await db.campaigns.find_one({"id": campaign_id, "user_id": user_id})
            if not campaign:
                return None
            return Campaign(**campaign)
        except Exception as e:
            self.logger.error(f"Get campaign error: {str(e)}")
            raise Exception("Failed to fetch campaign")
    
    async def update_campaign(self, campaign_id: str, user_id: str, title: Optional[str] = None, content: Optional[str] = None) -> bool:
        """Update campaign details"""
        try:
            update_data = {}
            if title:
                update_data["title"] = title
            if content:
                update_data["content"] = content
            
            if not update_data:
                raise ValueError("No data to update")
            
            result = await db.campaigns.update_one(
                {"id": campaign_id, "user_id": user_id},
                {"$set": update_data}
            )
            
            return result.matched_count > 0
            
        except ValueError:
            raise
        except Exception as e:
            self.logger.error(f"Update campaign error: {str(e)}")
            raise Exception("Failed to update campaign")
    
    async def delete_campaign(self, campaign_id: str, user_id: str) -> bool:
        """Delete campaign"""
        try:
            result = await db.campaigns.delete_one({"id": campaign_id, "user_id": user_id})
            return result.deleted_count > 0
        except Exception as e:
            self.logger.error(f"Delete campaign error: {str(e)}")
            raise Exception("Failed to delete campaign")
    
    async def get_campaign_performance_stats(self, user_id: str) -> Dict[str, Any]:
        """Get campaign performance statistics for user"""
        try:
            # Get total campaigns
            total_campaigns = await db.campaigns.count_documents({"user_id": user_id})
            
            # Get campaigns by status
            draft_campaigns = await db.campaigns.count_documents({"user_id": user_id, "status": "draft"})
            sent_campaigns = await db.campaigns.count_documents({"user_id": user_id, "status": "sent"})
            
            # Get total emails sent
            sent_campaign_list = await db.campaigns.find({"user_id": user_id, "status": "sent"}).to_list(1000)
            total_emails_sent = sum(campaign.get("performance", {}).get("sent_count", 0) for campaign in sent_campaign_list)
            
            # Get campaigns by type
            campaigns_by_type = {}
            for campaign_type in ["email", "social_media", "direct_message"]:
                count = await db.campaigns.count_documents({"user_id": user_id, "campaign_type": campaign_type})
                campaigns_by_type[campaign_type] = count
            
            return {
                "total_campaigns": total_campaigns,
                "draft_campaigns": draft_campaigns,
                "sent_campaigns": sent_campaigns,
                "total_emails_sent": total_emails_sent,
                "campaigns_by_type": campaigns_by_type
            }
            
        except Exception as e:
            self.logger.error(f"Get campaign stats error: {str(e)}")
            raise Exception("Failed to fetch campaign statistics")
    
    async def schedule_campaign(self, campaign_id: str, user_id: str, scheduled_at: datetime) -> bool:
        """Schedule campaign for future sending"""
        try:
            result = await db.campaigns.update_one(
                {"id": campaign_id, "user_id": user_id},
                {
                    "$set": {
                        "scheduled_at": scheduled_at,
                        "status": "scheduled"
                    }
                }
            )
            return result.matched_count > 0
        except Exception as e:
            self.logger.error(f"Schedule campaign error: {str(e)}")
            raise Exception("Failed to schedule campaign")
    
    def validate_campaign_type(self, campaign_type: str) -> bool:
        """Validate campaign type"""
        valid_types = ["email", "social_media", "direct_message"]
        return campaign_type in valid_types
    
    def validate_campaign_style(self, style: str) -> bool:
        """Validate campaign style"""
        valid_styles = ["persuasive", "informative", "casual", "professional", "urgent", "friendly"]
        return style in valid_styles