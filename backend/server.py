from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import RedirectResponse
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
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gemini API configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

# Create the main app without a prefix
app = FastAPI(title="AI Marketing Agent API", version="1.0.0")

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
    interaction_type: str  # opened, clicked, replied, sent
    status: str = "cold"  # cold, warm, hot
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class EmailSendRequest(BaseModel):
    recipients: List[str]

class LeadStatusUpdate(BaseModel):
    status: str

class SimpleAuthRequest(BaseModel):
    email: str
    password: Optional[str] = None
    name: Optional[str] = None

# Authentication helpers
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = await db.users.find_one({"session_token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return User(**user)

# Gemini API helper function
async def generate_ai_content_with_gemini(prompt: str) -> str:
    """Generate content using Google Gemini API"""
    try:
        if not GEMINI_API_KEY:
            return "AI content generation not configured. Please set GEMINI_API_KEY."
        
        headers = {
            "Content-Type": "application/json",
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 3000,
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logging.error(f"Gemini API error: {response.status_code} - {response.text}")
                return "AI content generation temporarily unavailable. Please try again later."
            
            result = response.json()
            
            if "candidates" in result and len(result["candidates"]) > 0:
                content = result["candidates"][0]["content"]["parts"][0]["text"]
                return content.strip()
            else:
                return "AI content generation failed. Please try again."
                
    except Exception as e:
        logging.error(f"Gemini API error: {str(e)}")
        return "AI content generation temporarily unavailable. Please try again later."

# DEBUG ENDPOINT - Add this to help troubleshoot
@api_router.get("/debug/google-config")
async def debug_google_config():
    """Debug endpoint to check Google OAuth configuration"""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    redirect_uri = "http://localhost:8001/api/auth/google/callback"
    
    return {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "full_auth_url": (
            f"https://accounts.google.com/o/oauth2/auth"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope=openid email profile"
            f"&response_type=code"
            f"&access_type=offline"
        )
    }

# Google OAuth - SINGLE SET OF ENDPOINTS
@api_router.get("/auth/google/login")
async def google_login():
    """Redirect to Google OAuth"""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    redirect_uri = "http://localhost:8001/api/auth/google/callback"
    
    if not client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=openid email profile"
        f"&response_type=code"
        f"&access_type=offline"
    )
    
    logging.info(f"Google OAuth URL: {google_auth_url}")
    logging.info(f"Redirect URI: {redirect_uri}")
    
    return {"auth_url": google_auth_url}

@api_router.get("/auth/google/callback")
async def google_callback(code: str = Query(..., description="OAuth authorization code")):
    """Handle Google OAuth callback"""
    try:
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        redirect_uri = "http://localhost:8001/api/auth/google/callback"
        
        logging.info(f"Processing callback with redirect_uri: {redirect_uri}")
        
        if not all([client_id, client_secret]):
            raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
        async with httpx.AsyncClient() as http_client:
            # Exchange code for tokens
            token_data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            }
            
            logging.info(f"Token exchange data: {token_data}")
            
            token_response = await http_client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            logging.info(f"Token response status: {token_response.status_code}")
            
            if token_response.status_code != 200:
                logging.error(f"Token exchange failed: {token_response.text}")
                # Redirect to frontend with error
                return RedirectResponse(url="http://localhost:3000?error=auth_failed")
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            if not access_token:
                logging.error("No access token received")
                return RedirectResponse(url="http://localhost:3000?error=no_token")
            
            # Get user info
            user_response = await http_client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                logging.error(f"User info fetch failed: {user_response.text}")
                return RedirectResponse(url="http://localhost:3000?error=user_info_failed")
            
            user_info = user_response.json()
            logging.info(f"User info received: {user_info.get('email')}")
            
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
            
            # Redirect back to frontend with auth data
            frontend_url = f"http://localhost:3000?token={session_token}&user={user_info['email']}&name={user_info['name']}"
            if user_info.get('picture'):
                frontend_url += f"&picture={user_info['picture']}"
            
            return RedirectResponse(url=frontend_url)
            
    except HTTPException:
        return RedirectResponse(url="http://localhost:3000?error=auth_failed")
    except Exception as e:
        logging.error(f"Google OAuth error: {str(e)}")
        return RedirectResponse(url="http://localhost:3000?error=auth_failed")

# Simple email/password registration
@api_router.post("/auth/register")
async def register(request: SimpleAuthRequest):
    """Simple registration endpoint"""
    try:
        if not all([request.email, request.name]):
            raise HTTPException(status_code=400, detail="Email and name are required")
            
        # Check if user exists
        existing_user = await db.users.find_one({"email": request.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create new user
        session_token = str(uuid.uuid4())
        user_data = User(
            email=request.email,
            name=request.name,
            session_token=session_token
        )
        await db.users.insert_one(user_data.dict())
        
        return {
            "user": user_data.dict(),
            "token": session_token,
            "message": "Registration successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

# Simple login endpoint
@api_router.post("/auth/login")
async def login(request: SimpleAuthRequest):
    """Simple login endpoint"""
    try:
        # Find user
        user = await db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate new session token
        session_token = str(uuid.uuid4())
        await db.users.update_one(
            {"email": request.email},
            {"$set": {"session_token": session_token}}
        )
        
        user_data = User(**user)
        user_data.session_token = session_token
        
        return {
            "user": user_data.dict(),
            "token": session_token,
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

# Onboarding
@api_router.post("/onboarding")
async def complete_onboarding(data: OnboardingData, user: User = Depends(get_current_user)):
    """Complete user onboarding"""
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
    """Generate AI-powered marketing campaign"""
    try:
        if not user.onboarding_completed:
            raise HTTPException(status_code=400, detail="Please complete onboarding first")
        
        # Get user business details
        user_data = await db.users.find_one({"id": user.id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create system prompt
        system_context = f"""You are an expert marketing campaign generator. Create compelling, professional marketing content.

Business Details:
- Business Type: {user_data.get('business_type')}
- Industry: {user_data.get('industry')}
- Product/Service: {user_data.get('product_service')}
- Target Audience: {user_data.get('target_audience')}
- Campaign Goal: {user_data.get('campaign_goal')}
- Style: {request.style}

Generate content that is professional, engaging, and tailored to this specific business and audience."""
        
        # Create campaign generation prompt based on type
        if request.campaign_type == "email":
            prompt = f"""{system_context}

Generate a complete email marketing sequence (3 emails) for this business.

Create 3 emails with:
1. Compelling subject lines
2. Engaging content that speaks to the target audience
3. Clear call-to-actions
4. Professional tone that matches the {request.style} style

Format as:
EMAIL 1:
Subject: [subject line]

[email content with proper formatting]

EMAIL 2:
Subject: [subject line]

[email content with proper formatting]

EMAIL 3:
Subject: [subject line]

[email content with proper formatting]"""
        
        elif request.campaign_type == "social_media":
            prompt = f"""{system_context}

Generate 5 social media posts for this business.

Create posts for different platforms (LinkedIn, Instagram, Twitter/X) that:
1. Are platform-appropriate
2. Include relevant hashtags
3. Have engaging copy in {request.style} style
4. Include clear call-to-action

Format as:
POST 1 (LinkedIn):
[content]
#hashtags

POST 2 (Instagram):
[content]
#hashtags

POST 3 (Twitter/X):
[content]
#hashtags

POST 4 (LinkedIn):
[content]
#hashtags

POST 5 (Instagram):
[content]
#hashtags"""
        
        elif request.campaign_type == "direct_message":
            prompt = f"""{system_context}

Generate 3 direct message templates for this business.

Create 3 DM templates:
1. Cold outreach message
2. Follow-up message
3. Final touch message

Each should be:
- Personalized and conversational
- Brief and to the point (under 150 words)
- Include clear value proposition
- {request.style} but professional

Format as:
MESSAGE 1 (Cold Outreach):
[content]

MESSAGE 2 (Follow-up):
[content]

MESSAGE 3 (Final Touch):
[content]"""
        
        else:
            prompt = f"{system_context}\n\nGenerate marketing content for {request.campaign_type} campaign."
        
        # Add custom prompt if provided
        if request.custom_prompt:
            prompt += f"\n\nAdditional Requirements: {request.custom_prompt}"
        
        # Generate campaign content using Gemini
        content = await generate_ai_content_with_gemini(prompt)
        
        # Create campaign record
        campaign = Campaign(
            user_id=user.id,
            title=f"{request.campaign_type.replace('_', ' ').title()} Campaign - {datetime.now().strftime('%Y-%m-%d')}",
            campaign_type=request.campaign_type,
            content=content,
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
    """Get all campaigns for user"""
    try:
        campaigns = await db.campaigns.find({"user_id": user.id}).sort("created_at", -1).to_list(1000)
        return [Campaign(**campaign) for campaign in campaigns]
    except Exception as e:
        logging.error(f"Get campaigns error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaigns")

@api_router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    """Get specific campaign"""
    try:
        campaign = await db.campaigns.find_one({"id": campaign_id, "user_id": user.id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return Campaign(**campaign)
    except Exception as e:
        logging.error(f"Get campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaign")

@api_router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, title: Optional[str] = None, content: Optional[str] = None, user: User = Depends(get_current_user)):
    """Update campaign"""
    try:
        update_data = {}
        if title:
            update_data["title"] = title
        if content:
            update_data["content"] = content
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        result = await db.campaigns.update_one(
            {"id": campaign_id, "user_id": user.id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return {"message": "Campaign updated successfully"}
    except Exception as e:
        logging.error(f"Update campaign error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update campaign")

@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    """Delete campaign"""
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
async def send_email_campaign(campaign_id: str, request: EmailSendRequest, user: User = Depends(get_current_user)):
    """Send email campaign to recipients"""
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
        email = os.environ.get("SENDER_EMAIL")
        password = os.environ.get("EMAIL_APP_PASSWORD")
        
        if not all([email, password]):
            raise HTTPException(status_code=500, detail="Email configuration not set")
        
        sent_count = 0
        failed_recipients = []
        
        # Send emails
        for recipient in request.recipients:
            try:
                msg = MIMEMultipart()
                msg['From'] = email
                msg['To'] = recipient
                msg['Subject'] = f"{campaign['title']}"
                
                # Convert content to HTML if needed
                content = campaign['content'].replace('\n', '<br>')
                msg.attach(MIMEText(content, 'html'))
                
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
    """Get all leads for user"""
    try:
        leads = await db.leads.find({"user_id": user.id}).sort("created_at", -1).to_list(1000)
        return [Lead(**lead) for lead in leads]
    except Exception as e:
        logging.error(f"Get leads error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch leads")

@api_router.put("/leads/{lead_id}/status")
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

# Dashboard
@api_router.get("/dashboard")
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

# User profile
@api_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    """Get user profile"""
    user_data = await db.users.find_one({"id": user.id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_data)

@api_router.put("/profile")
async def update_profile(data: OnboardingData, user: User = Depends(get_current_user)):
    """Update user profile"""
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
    return {"message": "AI Marketing Agent API", "status": "active", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        await db.users.find_one({})
        
        # Test Gemini API
        gemini_status = "configured" if GEMINI_API_KEY else "not configured"
        
        # Check Google OAuth
        google_oauth_status = "configured" if all([
            os.environ.get("GOOGLE_CLIENT_ID"),
            os.environ.get("GOOGLE_CLIENT_SECRET")
        ]) else "not configured"
        
        return {
            "status": "healthy", 
            "database": "connected",
            "gemini_api": gemini_status,
            "google_oauth": google_oauth_status,
            "cors": "enabled"
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Add preflight OPTIONS handler for CORS
@api_router.options("/{path:path}")
async def options_handler():
    return {"message": "OK"}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware - SINGLE CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("AI Marketing Agent API starting up...")
    logger.info(f"Database: {os.environ.get('DB_NAME')}")
    logger.info(f"Gemini API: {'Configured' if GEMINI_API_KEY else 'Not configured'}")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down database client...")
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)