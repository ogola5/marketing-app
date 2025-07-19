# utils/security.py
import uuid
import re
import secrets
import hashlib
from typing import Optional
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_session_token() -> str:
    """Generate a secure session token"""
    return str(uuid.uuid4())

def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token"""
    return secrets.token_urlsafe(length)

def validate_email(email: str) -> bool:
    """Validate email format using regex"""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email) is not None

def validate_password_strength(password: str) -> dict:
    """Validate password strength and return requirements status"""
    requirements = {
        "min_length": len(password) >= 8,
        "has_uppercase": bool(re.search(r'[A-Z]', password)),
        "has_lowercase": bool(re.search(r'[a-z]', password)),
        "has_digit": bool(re.search(r'\d', password)),
        "has_special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    }
    
    requirements["is_valid"] = all(requirements.values())
    
    return requirements

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def generate_api_key(prefix: str = "mk") -> str:
    """Generate an API key with optional prefix"""
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}_{random_part}"

def mask_email(email: str) -> str:
    """Mask email for privacy (e.g., john@example.com -> j***@example.com)"""
    if not validate_email(email):
        return email
    
    local, domain = email.split('@')
    if len(local) <= 3:
        masked_local = local[0] + '*' * (len(local) - 1)
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    
    return f"{masked_local}@{domain}"

def generate_verification_code(length: int = 6) -> str:
    """Generate a numeric verification code"""
    return ''.join(secrets.choice('0123456789') for _ in range(length))

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to remove potentially harmful characters"""
    # Remove or replace dangerous characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove any non-printable characters
    sanitized = ''.join(char for char in sanitized if char.isprintable())
    # Limit length
    return sanitized[:255]

def generate_csrf_token() -> str:
    """Generate CSRF token"""
    return secrets.token_urlsafe(32)

def create_hmac_signature(message: str, secret: str) -> str:
    """Create HMAC signature for message verification"""
    import hmac
    return hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def verify_hmac_signature(message: str, signature: str, secret: str) -> bool:
    """Verify HMAC signature"""
    expected_signature = create_hmac_signature(message, secret)
    return hmac.compare_digest(expected_signature, signature)