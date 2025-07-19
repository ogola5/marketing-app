# routes/campaigns.py - Updated to use services
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

from config import db
from models import User, CampaignRequest, EmailSendRequest
from services import CampaignService, EmailService, AuthService
from utils import build_response, validate_email_list

router = APIRouter()
security = HTTPBearer()

# Initialize services
campaign_service = CampaignService()
email_service = EmailService()
auth_service = AuthService()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = await auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return user

# Campaign Generation - Much cleaner now!
@router.post("/campaigns/generate")
async def generate_campaign(request: CampaignRequest, user: User = Depends(get_current_user)):
    """Generate AI-powered marketing campaign"""
    try:
        result = await campaign_service.generate_campaign(
            user=user,
            campaign_type=request.campaign_type,
            style=request.style,
            custom_prompt=request.custom_prompt
        )
        
        return build_response(
            success=True,
            data=result["campaign"],
            message=result["message"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Campaign generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Get Campaigns - Super simple now!
@router.get("/campaigns")
async def get_campaigns(user: User = Depends(get_current_user)):
    """Get all campaigns for user"""
    try:
        campaigns = await campaign_service.get_user_campaigns(user.id)
        return build_response(
            success=True,
            data=[campaign.dict() for campaign in campaigns],
            message="Campaigns fetched successfully"
        )
    except Exception as e:
        logging.error(f"Get campaigns error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Get Single Campaign
@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    """Get specific campaign"""
    try:
        campaign = await campaign_service.get_campaign_by_id(campaign_id, user.id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return build_response(
            success=True,
            data=campaign.dict(),
            message="Campaign fetched successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Update Campaign
@router.put("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: str, 
    title: Optional[str] = None, 
    content: Optional[str] = None, 
    user: User = Depends(get_current_user)
):
    """Update campaign"""
    try:
        success = await campaign_service.update_campaign(campaign_id, user.id, title, content)
        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return build_response(
            success=True,
            message="Campaign updated successfully"
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Update campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Delete Campaign
@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    """Delete campaign"""
    try:
        success = await campaign_service.delete_campaign(campaign_id, user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return build_response(
            success=True,
            message="Campaign deleted successfully"
        )
    except Exception as e:
        logging.error(f"Delete campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Send Email Campaign - Much cleaner with services!
@router.post("/campaigns/{campaign_id}/send-email")
async def send_email_campaign(
    campaign_id: str, 
    request: EmailSendRequest, 
    user: User = Depends(get_current_user)
):
    """Send email campaign to recipients"""
    try:
        # Validate emails first
        validation = validate_email_list(request.recipients)
        if not validation["valid"]:
            return build_response(
                success=False,
                errors=validation["errors"]
            )
        
        # Get campaign
        campaign = await campaign_service.get_campaign_by_id(campaign_id, user.id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        if campaign.campaign_type != "email":
            raise HTTPException(status_code=400, detail="Campaign is not an email campaign")
        
        # Send emails using email service
        result = await email_service.send_campaign_emails(
            campaign=campaign.dict(),
            recipients=validation["valid_emails"],
            user_id=user.id
        )
        
        if result["success"]:
            return build_response(
                success=True,
                data={
                    "sent_count": result["sent_count"],
                    "failed_count": result["failed_count"],
                    "failed_recipients": result["failed_recipients"]
                },
                message=result["message"]
            )
        else:
            raise HTTPException(status_code=500, detail=result["message"])
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Send email campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email campaign")