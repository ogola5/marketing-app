# utils/constants.py
from enum import Enum
from typing import Dict, List

# Campaign Types
CAMPAIGN_TYPES = {
    "EMAIL": "email",
    "SOCIAL_MEDIA": "social_media", 
    "DIRECT_MESSAGE": "direct_message",
    "SMS": "sms",
    "PUSH_NOTIFICATION": "push_notification"
}

# Campaign Styles
CAMPAIGN_STYLES = {
    "PERSUASIVE": "persuasive",
    "INFORMATIVE": "informative",
    "CASUAL": "casual", 
    "PROFESSIONAL": "professional",
    "URGENT": "urgent",
    "FRIENDLY": "friendly",
    "AUTHORITATIVE": "authoritative",
    "CONVERSATIONAL": "conversational"
}

# Lead Statuses
LEAD_STATUSES = {
    "COLD": "cold",
    "WARM": "warm",
    "HOT": "hot",
    "CONVERTED": "converted",
    "UNQUALIFIED": "unqualified"
}

# Campaign Statuses
CAMPAIGN_STATUSES = {
    "DRAFT": "draft",
    "SCHEDULED": "scheduled", 
    "SENDING": "sending",
    "SENT": "sent",
    "COMPLETED": "completed",
    "PAUSED": "paused",
    "CANCELLED": "cancelled"
}

# Interaction Types
INTERACTION_TYPES = {
    "SENT": "sent",
    "OPENED": "opened",
    "CLICKED": "clicked",
    "REPLIED": "replied",
    "BOUNCED": "bounced",
    "UNSUBSCRIBED": "unsubscribed",
    "FORWARDED": "forwarded"
}

# Business Types
BUSINESS_TYPES = [
    "E-commerce",
    "SaaS",
    "Consulting",
    "Agency",
    "Retail",
    "Restaurant",
    "Healthcare",
    "Education",
    "Real Estate",
    "Finance",
    "Technology",
    "Manufacturing",
    "Non-profit",
    "Other"
]

# Industries
INDUSTRIES = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Manufacturing",
    "Real Estate",
    "Marketing",
    "Consulting",
    "E-commerce",
    "Food & Beverage",
    "Travel & Tourism",
    "Entertainment",
    "Automotive",
    "Construction",
    "Energy",
    "Agriculture",
    "Fashion",
    "Sports",
    "Media",
    "Other"
]

# Campaign Goals
CAMPAIGN_GOALS = [
    "Lead Generation",
    "Sales Conversion",
    "Brand Awareness",
    "Customer Retention",
    "Product Launch",
    "Event Promotion",
    "Newsletter Signup",
    "App Downloads",
    "Website Traffic",
    "Social Media Engagement",
    "Customer Feedback",
    "Upsell/Cross-sell",
    "Other"
]

# Email Templates
EMAIL_TEMPLATES = {
    "WELCOME": {
        "subject": "Welcome to {business_name}!",
        "content": """
        Hi {name},
        
        Welcome to {business_name}! We're excited to have you on board.
        
        {custom_message}
        
        Best regards,
        The {business_name} Team
        """
    },
    "FOLLOW_UP": {
        "subject": "Following up on {topic}",
        "content": """
        Hi {name},
        
        I wanted to follow up on our previous conversation about {topic}.
        
        {custom_message}
        
        Looking forward to hearing from you.
        
        Best regards,
        {sender_name}
        """
    },
    "PROMOTIONAL": {
        "subject": "Special Offer: {offer_title}",
        "content": """
        Hi {name},
        
        We have an exciting offer just for you!
        
        {offer_description}
        
        {call_to_action}
        
        This offer expires on {expiry_date}.
        
        Best regards,
        The {business_name} Team
        """
    }
}

# Social Media Platforms
SOCIAL_PLATFORMS = {
    "LINKEDIN": "linkedin",
    "TWITTER": "twitter", 
    "INSTAGRAM": "instagram",
    "FACEBOOK": "facebook",
    "TIKTOK": "tiktok",
    "YOUTUBE": "youtube"
}

# AI Prompt Templates
AI_PROMPT_TEMPLATES = {
    "EMAIL_SEQUENCE": """
    Create a {style} email marketing sequence for a {business_type} business in the {industry} industry.
    
    Business Details:
    - Product/Service: {product_service}
    - Target Audience: {target_audience}
    - Campaign Goal: {campaign_goal}
    
    Generate {email_count} emails with compelling subject lines and engaging content.
    """,
    
    "SOCIAL_MEDIA": """
    Create {post_count} {style} social media posts for a {business_type} business in the {industry} industry.
    
    Business Details:
    - Product/Service: {product_service}
    - Target Audience: {target_audience}
    - Campaign Goal: {campaign_goal}
    
    Include appropriate hashtags and platform-specific formatting.
    """,
    
    "DIRECT_MESSAGE": """
    Create {message_count} {style} direct message templates for a {business_type} business in the {industry} industry.
    
    Business Details:
    - Product/Service: {product_service}
    - Target Audience: {target_audience}
    - Campaign Goal: {campaign_goal}
    
    Messages should be personalized, brief, and include clear value propositions.
    """
}

# HTTP Status Messages
HTTP_STATUS_MESSAGES = {
    200: "OK",
    201: "Created",
    400: "Bad Request",
    401: "Unauthorized", 
    403: "Forbidden",
    404: "Not Found",
    422: "Unprocessable Entity",
    500: "Internal Server Error"
}

# File Upload Limits
FILE_UPLOAD_LIMITS = {
    "MAX_FILE_SIZE": 10 * 1024 * 1024,  # 10MB
    "ALLOWED_EXTENSIONS": [".csv", ".xlsx", ".txt", ".json"],
    "MAX_FILES_PER_UPLOAD": 5
}

# Rate Limiting
RATE_LIMITS = {
    "AUTH_ATTEMPTS": {"requests": 5, "window": 300},  # 5 attempts per 5 minutes
    "API_CALLS": {"requests": 100, "window": 3600},   # 100 requests per hour
    "EMAIL_SENDING": {"requests": 50, "window": 3600}  # 50 emails per hour
}

# Validation Rules
VALIDATION_RULES = {
    "PASSWORD_MIN_LENGTH": 8,
    "NAME_MAX_LENGTH": 100,
    "EMAIL_MAX_LENGTH": 254,
    "CAMPAIGN_TITLE_MAX_LENGTH": 200,
    "CAMPAIGN_CONTENT_MAX_LENGTH": 10000,
    "BUSINESS_NAME_MAX_LENGTH": 100
}

# Default Pagination
DEFAULT_PAGINATION = {
    "PAGE_SIZE": 20,
    "MAX_PAGE_SIZE": 100,
    "DEFAULT_PAGE": 1
}

# Time Formats
TIME_FORMATS = {
    "DATE_ONLY": "%Y-%m-%d",
    "DATETIME_STANDARD": "%Y-%m-%d %H:%M:%S",
    "DATETIME_WITH_TIMEZONE": "%Y-%m-%d %H:%M:%S %Z",
    "TIME_ONLY": "%H:%M:%S",
    "HUMAN_READABLE": "%B %d, %Y at %I:%M %p"
}

# Success Messages
SUCCESS_MESSAGES = {
    "USER_CREATED": "User account created successfully",
    "LOGIN_SUCCESS": "Login successful",
    "LOGOUT_SUCCESS": "Logout successful", 
    "CAMPAIGN_CREATED": "Campaign created successfully",
    "CAMPAIGN_UPDATED": "Campaign updated successfully",
    "CAMPAIGN_DELETED": "Campaign deleted successfully",
    "EMAIL_SENT": "Email sent successfully",
    "PROFILE_UPDATED": "Profile updated successfully",
    "ONBOARDING_COMPLETED": "Onboarding completed successfully"
}

# Error Messages  
ERROR_MESSAGES = {
    "INVALID_CREDENTIALS": "Invalid email or password",
    "USER_NOT_FOUND": "User not found",
    "USER_ALREADY_EXISTS": "User with this email already exists",
    "UNAUTHORIZED": "Unauthorized access",
    "CAMPAIGN_NOT_FOUND": "Campaign not found",
    "INVALID_CAMPAIGN_TYPE": "Invalid campaign type",
    "EMAIL_SEND_FAILED": "Failed to send email",
    "ONBOARDING_REQUIRED": "Please complete onboarding first",
    "INVALID_FILE_FORMAT": "Invalid file format",
    "FILE_TOO_LARGE": "File size exceeds limit"
}

class CampaignTypeEnum(str, Enum):
    EMAIL = "email"
    SOCIAL_MEDIA = "social_media"
    DIRECT_MESSAGE = "direct_message"
    SMS = "sms"

class CampaignStatusEnum(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    COMPLETED = "completed"

class LeadStatusEnum(str, Enum):
    COLD = "cold"
    WARM = "warm"
    HOT = "hot"
    CONVERTED = "converted"