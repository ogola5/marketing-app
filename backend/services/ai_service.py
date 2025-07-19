# services/ai_service.py
import httpx
import logging
from typing import Dict, Any

from config import settings

class AIService:
    """Service for AI content generation using Google Gemini"""
    
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.api_url = settings.gemini_api_url
        self.logger = logging.getLogger(__name__)
    
    async def generate_content(self, prompt: str) -> str:
        """Generate content using Google Gemini API"""
        try:
            if not self.api_key:
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
                    f"{self.api_url}?key={self.api_key}",
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    self.logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                    return "AI content generation temporarily unavailable. Please try again later."
                
                result = response.json()
                
                if "candidates" in result and len(result["candidates"]) > 0:
                    content = result["candidates"][0]["content"]["parts"][0]["text"]
                    return content.strip()
                else:
                    return "AI content generation failed. Please try again."
                    
        except Exception as e:
            self.logger.error(f"Gemini API error: {str(e)}")
            return "AI content generation temporarily unavailable. Please try again later."
    
    def build_campaign_prompt(self, user_data: Dict[str, Any], campaign_type: str, style: str, custom_prompt: str = None) -> str:
        """Build campaign generation prompt based on user data and campaign type"""
        
        # Create system context
        system_context = f"""You are an expert marketing campaign generator. Create compelling, professional marketing content.

Business Details:
- Business Type: {user_data.get('business_type')}
- Industry: {user_data.get('industry')}
- Product/Service: {user_data.get('product_service')}
- Target Audience: {user_data.get('target_audience')}
- Campaign Goal: {user_data.get('campaign_goal')}
- Style: {style}

Generate content that is professional, engaging, and tailored to this specific business and audience."""
        
        # Create campaign generation prompt based on type
        if campaign_type == "email":
            prompt = f"""{system_context}

Generate a complete email marketing sequence (3 emails) for this business.

Create 3 emails with:
1. Compelling subject lines
2. Engaging content that speaks to the target audience
3. Clear call-to-actions
4. Professional tone that matches the {style} style

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
        
        elif campaign_type == "social_media":
            prompt = f"""{system_context}

Generate 5 social media posts for this business.

Create posts for different platforms (LinkedIn, Instagram, Twitter/X) that:
1. Are platform-appropriate
2. Include relevant hashtags
3. Have engaging copy in {style} style
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
        
        elif campaign_type == "direct_message":
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
- {style} but professional

Format as:
MESSAGE 1 (Cold Outreach):
[content]

MESSAGE 2 (Follow-up):
[content]

MESSAGE 3 (Final Touch):
[content]"""
        
        else:
            prompt = f"{system_context}\n\nGenerate marketing content for {campaign_type} campaign."
        
        # Add custom prompt if provided
        if custom_prompt:
            prompt += f"\n\nAdditional Requirements: {custom_prompt}"
        
        return prompt
    
    async def generate_campaign_content(self, user_data: Dict[str, Any], campaign_type: str, style: str, custom_prompt: str = None) -> str:
        """Generate campaign content for specific user and campaign type"""
        prompt = self.build_campaign_prompt(user_data, campaign_type, style, custom_prompt)
        return await self.generate_content(prompt)