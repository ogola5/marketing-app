# services/fundability_checker.py
from urllib.parse import urlparse
import re

class FundabilityChecker:
    def __init__(self):
        pass  # Add initialization logic if needed

    def is_fundable(self, business_data: dict) -> dict:
        """
        Basic checklist to determine if a business is ready for SEO boost and listing.
        Returns fundability score and decision.
        """
        score = 0
        checks = {}

        # 1. Check if website exists and has SSL
        website = business_data.get("website", "")
        has_ssl = website.startswith("https://")
        score += 10 if has_ssl else 0
        checks["ssl"] = has_ssl

        # 2. Check if business is registered
        is_registered = business_data.get("registered", False)
        score += 15 if is_registered else 0
        checks["registered"] = is_registered

        # 3. Check if contact info is present
        has_contact = bool(re.search(r'\d{3,}', business_data.get("phone", "")))
        score += 10 if has_contact else 0
        checks["contact"] = has_contact

        # 4. Check if website age is > 1 year
        domain_age = business_data.get("domain_age", 0)  # in years
        score += 10 if domain_age >= 1 else 0
        checks["domain_age"] = domain_age

        # 5. Check if business has reviews
        reviews_count = business_data.get("reviews", 0)
        score += min(10, reviews_count)  # 1 point per review up to 10
        checks["reviews"] = reviews_count

        # 6. Product/service page exists
        has_service_page = business_data.get("has_service_page", False)
        score += 10 if has_service_page else 0
        checks["has_service_page"] = has_service_page

        # 7. SEO meta tags detected (optional)
        has_seo_tags = business_data.get("has_seo_tags", False)
        score += 5 if has_seo_tags else 0
        checks["has_seo_tags"] = has_seo_tags

        # Determine fundability threshold
        threshold = 50
        fundable = score >= threshold

        return {
            "fundable": fundable,
            "score": score,
            "threshold": threshold,
            "checklist": checks
        }

__all__ = ['FundabilityChecker']  # Export the class