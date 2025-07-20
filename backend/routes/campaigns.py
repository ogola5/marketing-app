# routes/campaigns.py
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

# Generate AI Campaign (Fix: Returns 'campaign' key directly)
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

        # Ensure the response structure matches frontend expectations
        campaign_data = {
            "title": f"{request.campaign_type.title()} Campaign",
            "content": result.get("content", "")
        }

        return {
            "success": True,
            "campaign": campaign_data,
            "message": "Campaign generated successfully"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Campaign generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate campaign")

# Get all campaigns
@router.get("/campaigns")
async def get_campaigns(user: User = Depends(get_current_user)):
    try:
        campaigns = await campaign_service.get_user_campaigns(user.id)
        return build_response(
            success=True,
            data=[campaign.dict() for campaign in campaigns],
            message="Campaigns fetched successfully"
        )
    except Exception as e:
        logging.error(f"Get campaigns error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaigns")

# Get a single campaign
@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    try:
        campaign = await campaign_service.get_campaign_by_id(campaign_id, user.id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return build_response(
            success=True,
            data=campaign.dict(),
            message="Campaign fetched successfully"
        )
    except Exception as e:
        logging.error(f"Get campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaign")

# Update campaign
@router.put("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    try:
        success = await campaign_service.update_campaign(campaign_id, user.id, title, content)
        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return build_response(success=True, message="Campaign updated successfully")
    except Exception as e:
        logging.error(f"Update campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update campaign")

# Delete campaign
@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    try:
        success = await campaign_service.delete_campaign(campaign_id, user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return build_response(success=True, message="Campaign deleted successfully")
    except Exception as e:
        logging.error(f"Delete campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete campaign")

# Send email campaign
@router.post("/campaigns/{campaign_id}/send-email")
async def send_email_campaign(
    campaign_id: str,
    request: EmailSendRequest,
    user: User = Depends(get_current_user)
):
    try:
        validation = validate_email_list(request.recipients)
        if not validation["valid"]:
            return build_response(success=False, errors=validation["errors"])

        campaign = await campaign_service.get_campaign_by_id(campaign_id, user.id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if campaign.campaign_type != "email":
            raise HTTPException(status_code=400, detail="Not an email campaign")

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
    except Exception as e:
        logging.error(f"Send email campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email campaign")
