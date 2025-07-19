# routes/leads.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from config import db
from models import User, Lead, LeadStatusUpdate

router = APIRouter()
security = HTTPBearer()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = await db.users.find_one({"session_token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return User(**user)

# Leads Management
@router.get("/leads")
async def get_leads(user: User = Depends(get_current_user)):
    """Get all leads for user"""
    try:
        leads = await db.leads.find({"user_id": user.id}).sort("created_at", -1).to_list(1000)
        return [Lead(**lead) for lead in leads]
    except Exception as e:
        logging.error(f"Get leads error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch leads")

@router.put("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, request: LeadStatusUpdate, user: User = Depends(get_current_user)):
    """Update lead status"""
    try:
        if request.status not in ["cold", "warm", "hot"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be 'cold', 'warm', or 'hot'")
        
        result = await db.leads.update_one(
            {"id": lead_id, "user_id": user.id},
            {"$set": {"status": request.status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return {"message": "Lead status updated successfully"}
    except Exception as e:
        logging.error(f"Update lead status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update lead status")