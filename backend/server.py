from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from emergentintegrations.llm.chat import LlmChat, UserMessage
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    session_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Business profile
    business_type: Optional[str] = None
    industry: Optional[str] = None
    product_service: Optional[str] = None
    target_audience: Optional[str] = None
    campaign_goal: Optional[str] = None
    onboarding_completed: bool = False

class OnboardingData(BaseModel):
    business_type: str
    industry: str
    product_service: str
    target_audience: str
    campaign_goal: str

class Campaign(BaseModel):
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
    campaign_type: str  # email, social_media, direct_message
    style: Optional[str] = "persuasive"
    custom_prompt: Optional[str] = None

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    campaign_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    interaction_type: str  # opened, clicked, replied
    status: str = "cold"  # cold, warm, hot
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

# Authentication helpers
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = await db.users.find_one({"session_token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return User(**user)

# Google OAuth
@api_router.get("/auth/google/login")
async def google_login():
    # Redirect to Google OAuth
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "961002144076-aqql6u8ij55jctlu7673bdasodgp0ahv.apps.googleusercontent.com")
    redirect_uri = "https://11e31789-6f0f-4445-a4b4-f408464f27d3.preview.emergentagent.com/auth/callback"
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=openid email profile"
        f"&response_type=code"
        f"&access_type=offline"
    )
    
    return {"auth_url": google_auth_url}

@api_router.post("/auth/google/callback")
async def google_callback(code: str):
    try:
        # Exchange code for tokens
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "961002144076-aqql6u8ij55jctlu7673bdasodgp0ahv.apps.googleusercontent.com")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "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")
        redirect_uri = "https://11e31789-6f0f-4445-a4b4-f408464f27d3.preview.emergentagent.com/auth/callback"
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get access token")
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info")
            
            user_info = user_response.json()
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": user_info["email"]})
            
            if existing_user:
                # Update session token
                session_token = str(uuid.uuid4())
                await db.users.update_one(
                    {"email": user_info["email"]},
                    {"$set": {"session_token": session_token}}
                )
                user_data = User(**existing_user)
                user_data.session_token = session_token
            else:
                # Create new user
                session_token = str(uuid.uuid4())
                user_data = User(
                    email=user_info["email"],
                    name=user_info["name"],
                    picture=user_info.get("picture"),
                    session_token=session_token
                )
                await db.users.insert_one(user_data.dict())
            
            return {
                "user": user_data.dict(),
                "token": session_token,
                "message": "Authentication successful"
            }
            
    except Exception as e:
        logging.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

# Emergent Auth
@api_router.get("/auth/emergent")
async def emergent_login():
    redirect_url = "https://11e31789-6f0f-4445-a4b4-f408464f27d3.preview.emergentagent.com"
    auth_url = f"https://auth.emergentagent.com/?redirect={redirect_url}"
    return {"auth_url": auth_url}

@api_router.post("/auth/emergent/profile")
async def emergent_profile(request: Request):
    try:
        session_id = request.headers.get("X-Session-ID")
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_info = response.json()
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": user_info["email"]})
            
            if existing_user:
                # Update session token
                session_token = user_info["session_token"]
                await db.users.update_one(
                    {"email": user_info["email"]},
                    {"$set": {"session_token": session_token}}
                )
                user_data = User(**existing_user)
                user_data.session_token = session_token
            else:
                # Create new user
                user_data = User(
                    email=user_info["email"],
                    name=user_info["name"],
                    picture=user_info.get("picture"),
                    session_token=user_info["session_token"]
                )
                await db.users.insert_one(user_data.dict())
            
            return {
                "user": user_data.dict(),
                "token": user_info["session_token"],
                "message": "Authentication successful"
            }
            
    except Exception as e:
        logging.error(f"Emergent auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

# Onboarding
@api_router.post("/onboarding")
async def complete_onboarding(data: OnboardingData, user: User = Depends(get_current_user)):
    try:
        await db.users.update_one(
            {"id": user.id},
            {
                "$set": {
                    "business_type": data.business_type,
                    "industry": data.industry,
                    "product_service": data.product_service,
                    "target_audience": data.target_audience,
                    "campaign_goal": data.campaign_goal,
                    "onboarding_completed": True
                }
            }
        )
        
        return {"message": "Onboarding completed successfully"}
    except Exception as e:
        logging.error(f"Onboarding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save onboarding data")

# Campaign Generation
@api_router.post("/campaigns/generate")
async def generate_campaign(request: CampaignRequest, user: User = Depends(get_current_user)):
    try:
        if not user.onboarding_completed:
            raise HTTPException(status_code=400, detail="Please complete onboarding first")
        
        # Get user business details
        user_data = await db.users.find_one({"id": user.id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create Gemini chat instance
        gemini_api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyDQ7K3zYEUykBZBpY5JZfhUaMMZFFOUg90")
        session_id = f"campaign_{user.id}_{str(uuid.uuid4())[:8]}"
        
        # System message for campaign generation
        system_message = f"""You are an expert marketing campaign generator. Create {request.campaign_type} campaigns that are {request.style} and engaging.

Business Details:
- Business Type: {user_data.get('business_type')}
- Industry: {user_data.get('industry')}
- Product/Service: {user_data.get('product_service')}
- Target Audience: {user_data.get('target_audience')}
- Campaign Goal: {user_data.get('campaign_goal')}

Generate content that is professional, compelling, and tailored to this specific business and audience."""

        chat = LlmChat(
            api_key=gemini_api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-2.5-pro-preview-05-06").with_max_tokens(4000)
        
        # Create campaign generation prompt based on type
        if request.campaign_type == "email":
            prompt = f"""Generate a complete email marketing sequence (3 emails) for {user_data.get('business_type')} targeting {user_data.get('target_audience')}.

Style: {request.style}
Goal: {user_data.get('campaign_goal')}

Include:
1. Subject lines for each email
2. Full email content
3. Clear call-to-actions
4. Personalization suggestions

Format as:
EMAIL 1:
Subject: [subject line]
[email content]

EMAIL 2:
Subject: [subject line]
[email content]

EMAIL 3:
Subject: [subject line]
[email content]"""
        
        elif request.campaign_type == "social_media":
            prompt = f"""Generate 5 social media posts for {user_data.get('business_type')} targeting {user_data.get('target_audience')}.

Style: {request.style}
Goal: {user_data.get('campaign_goal')}

Include posts for LinkedIn, Instagram, and Twitter/X. Each post should:
1. Be platform-appropriate
2. Include relevant hashtags
3. Have engaging copy
4. Include call-to-action

Format as:
POST 1 (LinkedIn):
[content]
#hashtags

POST 2 (Instagram):
[content]
#hashtags

[Continue for 5 posts]"""
        
        elif request.campaign_type == "direct_message":
            prompt = f"""Generate 3 direct message templates for {user_data.get('business_type')} targeting {user_data.get('target_audience')}.

Style: {request.style}
Goal: {user_data.get('campaign_goal')}

Include:
1. Cold outreach message
2. Follow-up message
3. Final touch message

Each should be:
- Personalized and conversational
- Brief and to the point
- Include clear value proposition
- Professional but approachable

Format as:
MESSAGE 1 (Cold Outreach):
[content]

MESSAGE 2 (Follow-up):
[content]

MESSAGE 3 (Final Touch):
[content]"""
        
        else:
            prompt = f"Generate marketing content for {request.campaign_type} campaign targeting {user_data.get('target_audience')} for a {user_data.get('business_type')} business."
        
        # Add custom prompt if provided
        if request.custom_prompt:
            prompt += f"\n\nAdditional Requirements: {request.custom_prompt}"
        
        # Generate campaign content
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Create campaign record
        campaign = Campaign(
            user_id=user.id,
            title=f"{request.campaign_type.replace('_', ' ').title()} Campaign - {datetime.now().strftime('%Y-%m-%d')}",
            campaign_type=request.campaign_type,
            content=response,
            style=request.style,
            status="draft"
        )
        
        # Save to database
        await db.campaigns.insert_one(campaign.dict())
        
        return {
            "campaign": campaign.dict(),
            "message": "Campaign generated successfully"
        }
        
    except Exception as e:
        logging.error(f"Campaign generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate campaign: {str(e)}")

# Campaign Management
@api_router.get("/campaigns")
async def get_campaigns(user: User = Depends(get_current_user)):
    try:
        campaigns = await db.campaigns.find({"user_id": user.id}).to_list(1000)
        return [Campaign(**campaign) for campaign in campaigns]
    except Exception as e:
        logging.error(f"Get campaigns error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaigns")

@api_router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    try:
        campaign = await db.campaigns.find_one({"id": campaign_id, "user_id": user.id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return Campaign(**campaign)
    except Exception as e:
        logging.error(f"Get campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaign")

@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    try:
        result = await db.campaigns.delete_one({"id": campaign_id, "user_id": user.id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return {"message": "Campaign deleted successfully"}
    except Exception as e:
        logging.error(f"Delete campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete campaign")

# Email Sending (SMTP)
@api_router.post("/campaigns/{campaign_id}/send-email")
async def send_email_campaign(campaign_id: str, recipients: List[str], user: User = Depends(get_current_user)):
    try:
        # Get campaign
        campaign = await db.campaigns.find_one({"id": campaign_id, "user_id": user.id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        if campaign["campaign_type"] != "email":
            raise HTTPException(status_code=400, detail="Campaign is not an email campaign")
        
        # Email configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        email = os.environ.get("SENDER_EMAIL", "ogolaevance5@gmail.com")
        password = os.environ.get("EMAIL_APP_PASSWORD", "glar aprr rihk tbuh")
        
        sent_count = 0
        failed_recipients = []
        
        # Send emails
        for recipient in recipients:
            try:
                msg = MIMEMultipart()
                msg['From'] = email
                msg['To'] = recipient
                msg['Subject'] = f"{campaign['title']}"
                
                msg.attach(MIMEText(campaign['content'], 'plain'))
                
                server = smtplib.SMTP(smtp_server, smtp_port)
                server.starttls()
                server.login(email, password)
                server.send_message(msg)
                server.quit()
                
                # Create lead entry
                lead = Lead(
                    user_id=user.id,
                    campaign_id=campaign_id,
                    email=recipient,
                    interaction_type="sent",
                    status="cold"
                )
                await db.leads.insert_one(lead.dict())
                
                sent_count += 1
                
            except Exception as e:
                logging.error(f"Failed to send email to {recipient}: {str(e)}")
                failed_recipients.append(recipient)
        
        # Update campaign status
        await db.campaigns.update_one(
            {"id": campaign_id},
            {
                "$set": {
                    "status": "sent",
                    "performance": {
                        "sent_count": sent_count,
                        "failed_count": len(failed_recipients),
                        "sent_at": datetime.utcnow().isoformat()
                    }
                }
            }
        )
        
        return {
            "message": f"Campaign sent successfully to {sent_count} recipients",
            "sent_count": sent_count,
            "failed_count": len(failed_recipients),
            "failed_recipients": failed_recipients
        }
        
    except Exception as e:
        logging.error(f"Send email campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email campaign")

# Leads Management
@api_router.get("/leads")
async def get_leads(user: User = Depends(get_current_user)):
    try:
        leads = await db.leads.find({"user_id": user.id}).to_list(1000)
        return [Lead(**lead) for lead in leads]
    except Exception as e:
        logging.error(f"Get leads error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch leads")

@api_router.put("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, status: str, user: User = Depends(get_current_user)):
    try:
        if status not in ["cold", "warm", "hot"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        result = await db.leads.update_one(
            {"id": lead_id, "user_id": user.id},
            {"$set": {"status": status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return {"message": "Lead status updated successfully"}
    except Exception as e:
        logging.error(f"Update lead status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update lead status")

# Dashboard
@api_router.get("/dashboard")
async def get_dashboard(user: User = Depends(get_current_user)):
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
        
        return {
            "campaigns_count": campaigns_count,
            "leads_count": leads_count,
            "leads_by_status": leads_by_status,
            "recent_campaigns": [Campaign(**campaign) for campaign in recent_campaigns]
        }
    except Exception as e:
        logging.error(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

# User profile
@api_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    user_data = await db.users.find_one({"id": user.id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_data)

@api_router.put("/profile")
async def update_profile(data: OnboardingData, user: User = Depends(get_current_user)):
    try:
        await db.users.update_one(
            {"id": user.id},
            {
                "$set": {
                    "business_type": data.business_type,
                    "industry": data.industry,
                    "product_service": data.product_service,
                    "target_audience": data.target_audience,
                    "campaign_goal": data.campaign_goal
                }
            }
        )
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logging.error(f"Update profile error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

# Basic health check
@api_router.get("/")
async def root():
    return {"message": "AI Marketing Agent API", "status": "active"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()