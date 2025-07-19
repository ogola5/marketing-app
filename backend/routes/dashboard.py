# routes/dashboard.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from config import db
from models import User, Campaign

router = APIRouter()
security = HTTPBearer()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = await db.users.find_one({"session_token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return User(**user)

# Dashboard
@router.get("/dashboard")
async def get_dashboard(user: User = Depends(get_current_user)):
    """Get dashboard data"""
    try:
        # Get counts
        campaigns_count = await db.campaigns.count_documents({"user_id": user.id})
        leads_count = await db.leads.count_documents({"user_id": user.id})
        
        # Get recent campaigns
        recent_campaigns = await db.campaigns.find({"user_id": user.id}).sort("created_at", -1).limit(5).to_list(5)
        
        # Get leads by status
        leads_by_status = {}
        for status in ["cold", "warm", "hot"]:
            count = await db.leads.count_documents({"user_id": user.id, "status": status})
            leads_by_status[status] = count
        
        # Get campaign performance
        sent_campaigns = await db.campaigns.find({"user_id": user.id, "status": "sent"}).to_list(1000)
        total_sent = sum(campaign.get("performance", {}).get("sent_count", 0) for campaign in sent_campaigns)
        
        return {
            "campaigns_count": campaigns_count,
            "leads_count": leads_count,
            "total_sent": total_sent,
            "leads_by_status": leads_by_status,
            "recent_campaigns": [Campaign(**campaign) for campaign in recent_campaigns]
        }
    except Exception as e:
        logging.error(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")