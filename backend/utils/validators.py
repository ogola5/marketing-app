# utils/validators.py
import re
from typing import List, Dict, Any, Optional
from .constants import (
    CAMPAIGN_TYPES, CAMPAIGN_STYLES, LEAD_STATUSES, 
    BUSINESS_TYPES, INDUSTRIES, CAMPAIGN_GOALS,
    VALIDATION_RULES
)

class ValidationError(Exception):
    """Custom validation error"""
    pass

def validate_email_format(email: str) -> bool:
    """Validate email format"""
    if not email:
        return False
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_pattern, email)) and len(email) <= VALIDATION_RULES["EMAIL_MAX_LENGTH"]

def validate_password(password: str) -> Dict[str, Any]:
    """Validate password strength"""
    if not password:
        return {"valid": False, "errors": ["Password is required"]}
    
    errors = []
    
    if len(password) < VALIDATION_RULES["PASSWORD_MIN_LENGTH"]:
        errors.append(f"Password must be at least {VALIDATION_RULES['PASSWORD_MIN_LENGTH']} characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one number")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_name(name: str) -> Dict[str, Any]:
    """Validate user name"""
    if not name:
        return {"valid": False, "errors": ["Name is required"]}
    
    name = name.strip()
    errors = []
    
    if len(name) < 2:
        errors.append("Name must be at least 2 characters long")
    
    if len(name) > VALIDATION_RULES["NAME_MAX_LENGTH"]:
        errors.append(f"Name must be no more than {VALIDATION_RULES['NAME_MAX_LENGTH']} characters long")
    
    if not re.match(r'^[a-zA-Z\s\-\'\.]+$', name):
        errors.append("Name can only contain letters, spaces, hyphens, apostrophes, and periods")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_campaign_type(campaign_type: str) -> bool:
    """Validate campaign type"""
    return campaign_type in CAMPAIGN_TYPES.values()

def validate_campaign_style(style: str) -> bool:
    """Validate campaign style"""
    return style in CAMPAIGN_STYLES.values()

def validate_lead_status(status: str) -> bool:
    """Validate lead status"""
    return status in LEAD_STATUSES.values()

def validate_business_type(business_type: str) -> bool:
    """Validate business type"""
    return business_type in BUSINESS_TYPES

def validate_industry(industry: str) -> bool:
    """Validate industry"""
    return industry in INDUSTRIES

def validate_campaign_goal(goal: str) -> bool:
    """Validate campaign goal"""
    return goal in CAMPAIGN_GOALS

def validate_campaign_title(title: str) -> Dict[str, Any]:
    """Validate campaign title"""
    if not title:
        return {"valid": False, "errors": ["Campaign title is required"]}
    
    title = title.strip()
    errors = []
    
    if len(title) < 3:
        errors.append("Campaign title must be at least 3 characters long")
    
    if len(title) > VALIDATION_RULES["CAMPAIGN_TITLE_MAX_LENGTH"]:
        errors.append(f"Campaign title must be no more than {VALIDATION_RULES['CAMPAIGN_TITLE_MAX_LENGTH']} characters long")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_campaign_content(content: str) -> Dict[str, Any]:
    """Validate campaign content"""
    if not content:
        return {"valid": False, "errors": ["Campaign content is required"]}
    
    content = content.strip()
    errors = []
    
    if len(content) < 10:
        errors.append("Campaign content must be at least 10 characters long")
    
    if len(content) > VALIDATION_RULES["CAMPAIGN_CONTENT_MAX_LENGTH"]:
        errors.append(f"Campaign content must be no more than {VALIDATION_RULES['CAMPAIGN_CONTENT_MAX_LENGTH']} characters long")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_email_list(emails: List[str]) -> Dict[str, Any]:
    """Validate list of email addresses"""
    if not emails:
        return {"valid": False, "errors": ["Email list cannot be empty"]}
    
    valid_emails = []
    invalid_emails = []
    
    for email in emails:
        email = email.strip()
        if validate_email_format(email):
            valid_emails.append(email)
        else:
            invalid_emails.append(email)
    
    errors = []
    if invalid_emails:
        errors.append(f"Invalid email addresses: {', '.join(invalid_emails)}")
    
    if len(valid_emails) == 0:
        errors.append("No valid email addresses found")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "valid_emails": valid_emails,
        "invalid_emails": invalid_emails
    }

def validate_onboarding_data(data: Dict[str, str]) -> Dict[str, Any]:
    """Validate onboarding data"""
    required_fields = ["business_type", "industry", "product_service", "target_audience", "campaign_goal"]
    errors = []
    
    # Check required fields
    for field in required_fields:
        if not data.get(field):
            errors.append(f"{field.replace('_', ' ').title()} is required")
    
    # Validate specific fields
    if data.get("business_type") and not validate_business_type(data["business_type"]):
        errors.append("Invalid business type")
    
    if data.get("industry") and not validate_industry(data["industry"]):
        errors.append("Invalid industry")
    
    if data.get("campaign_goal") and not validate_campaign_goal(data["campaign_goal"]):
        errors.append("Invalid campaign goal")
    
    # Validate text field lengths
    for field in ["product_service", "target_audience"]:
        if data.get(field) and len(data[field]) > 500:
            errors.append(f"{field.replace('_', ' ').title()} must be no more than 500 characters")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_pagination_params(page: int, page_size: int) -> Dict[str, Any]:
    """Validate pagination parameters"""
    errors = []
    
    if page < 1:
        errors.append("Page number must be greater than 0")
    
    if page_size < 1:
        errors.append("Page size must be greater than 0")
    
    if page_size > 100:
        errors.append("Page size cannot exceed 100")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_file_upload(filename: str, file_size: int, allowed_extensions: List[str], max_size: int) -> Dict[str, Any]:
    """Validate file upload"""
    errors = []
    
    if not filename:
        errors.append("Filename is required")
        return {"valid": False, "errors": errors}
    
    # Check file extension
    file_extension = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
    if file_extension not in allowed_extensions:
        errors.append(f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")
    
    # Check file size
    if file_size > max_size:
        errors.append(f"File size ({file_size} bytes) exceeds maximum allowed size ({max_size} bytes)")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_campaign_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate campaign generation request"""
    errors = []
    
    # Validate campaign type
    campaign_type = data.get("campaign_type")
    if not campaign_type:
        errors.append("Campaign type is required")
    elif not validate_campaign_type(campaign_type):
        errors.append("Invalid campaign type")
    
    # Validate style
    style = data.get("style", "persuasive")
    if not validate_campaign_style(style):
        errors.append("Invalid campaign style")
    
    # Validate custom prompt length
    custom_prompt = data.get("custom_prompt")
    if custom_prompt and len(custom_prompt) > 1000:
        errors.append("Custom prompt must be no more than 1000 characters")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def sanitize_input(text: str, max_length: Optional[int] = None) -> str:
    """Sanitize text input"""
    if not text:
        return ""
    
    # Strip whitespace
    text = text.strip()
    
    # Remove potentially harmful characters
    text = re.sub(r'[<>]', '', text)
    
    # Limit length if specified
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text