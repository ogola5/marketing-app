# utils/helpers.py
import re
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Union
from email.utils import parseaddr

def format_datetime(dt: datetime, format_string: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format datetime object to string"""
    if dt is None:
        return ""
    return dt.strftime(format_string)

def parse_datetime(date_string: str, format_string: str = "%Y-%m-%d %H:%M:%S") -> Optional[datetime]:
    """Parse datetime string to datetime object"""
    try:
        return datetime.strptime(date_string, format_string)
    except (ValueError, TypeError):
        return None

def get_current_utc_time() -> datetime:
    """Get current UTC time"""
    return datetime.now(timezone.utc)

def clean_string(text: str, remove_extra_spaces: bool = True) -> str:
    """Clean and normalize string"""
    if not text:
        return ""
    
    # Remove leading/trailing whitespace
    cleaned = text.strip()
    
    # Remove extra spaces if requested
    if remove_extra_spaces:
        cleaned = re.sub(r'\s+', ' ', cleaned)
    
    return cleaned

def truncate_string(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate string to max length with optional suffix"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    # Convert to lowercase
    text = text.lower()
    # Replace spaces with hyphens
    text = re.sub(r'\s+', '-', text)
    # Remove non-alphanumeric characters except hyphens
    text = re.sub(r'[^a-z0-9-]', '', text)
    # Remove multiple consecutive hyphens
    text = re.sub(r'-+', '-', text)
    # Remove leading/trailing hyphens
    text = text.strip('-')
    return text

def paginate_results(items: List[Any], page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """Paginate a list of items"""
    if page < 1:
        page = 1
    
    total_items = len(items)
    total_pages = (total_items + page_size - 1) // page_size
    
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    
    paginated_items = items[start_index:end_index]
    
    return {
        "items": paginated_items,
        "pagination": {
            "current_page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    }

def build_response(success: bool, data: Any = None, message: str = "", errors: List[str] = None) -> Dict[str, Any]:
    """Build standardized API response"""
    response = {
        "success": success,
        "message": message,
        "timestamp": get_current_utc_time().isoformat()
    }
    
    if data is not None:
        response["data"] = data
    
    if errors:
        response["errors"] = errors
    
    return response

def extract_email_domain(email: str) -> Optional[str]:
    """Extract domain from email address"""
    try:
        name, addr = parseaddr(email)
        if '@' in addr:
            return addr.split('@')[1].lower()
        return None
    except:
        return None

def count_words(text: str) -> int:
    """Count words in text"""
    if not text:
        return 0
    return len(text.split())

def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags from text"""
    hashtag_pattern = r'#\w+'
    hashtags = re.findall(hashtag_pattern, text)
    return [tag.lower() for tag in hashtags]

def extract_mentions(text: str) -> List[str]:
    """Extract @mentions from text"""
    mention_pattern = r'@\w+'
    mentions = re.findall(mention_pattern, text)
    return [mention.lower() for mention in mentions]

def validate_json(json_string: str) -> bool:
    """Validate if string is valid JSON"""
    try:
        json.loads(json_string)
        return True
    except (ValueError, TypeError):
        return False

def safe_json_loads(json_string: str, default: Any = None) -> Any:
    """Safely load JSON with fallback"""
    try:
        return json.loads(json_string)
    except (ValueError, TypeError):
        return default

def calculate_percentage(part: Union[int, float], total: Union[int, float]) -> float:
    """Calculate percentage with zero division protection"""
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)

def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def merge_dicts(*dicts: Dict[str, Any]) -> Dict[str, Any]:
    """Merge multiple dictionaries"""
    result = {}
    for d in dicts:
        if d:
            result.update(d)
    return result

def remove_empty_values(data: Dict[str, Any], remove_none: bool = True, remove_empty_strings: bool = True) -> Dict[str, Any]:
    """Remove empty values from dictionary"""
    cleaned = {}
    for key, value in data.items():
        if remove_none and value is None:
            continue
        if remove_empty_strings and value == "":
            continue
        cleaned[key] = value
    return cleaned

def generate_campaign_title(campaign_type: str, business_type: str = None) -> str:
    """Generate a default campaign title"""
    formatted_type = campaign_type.replace('_', ' ').title()
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    if business_type:
        return f"{business_type} {formatted_type} Campaign - {current_date}"
    else:
        return f"{formatted_type} Campaign - {current_date}"

def extract_email_list_from_text(text: str) -> List[str]:
    """Extract valid email addresses from text"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return list(set(emails))  # Remove duplicates

def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """Calculate estimated reading time in minutes"""
    word_count = count_words(text)
    reading_time = max(1, round(word_count / words_per_minute))
    return reading_time