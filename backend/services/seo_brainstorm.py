# services/seo_brainstorm.py

from typing import Dict, Optional
from datetime import datetime


class SEOBrainstormService:
    def __init__(self):
        # Can be extended to use AI/ML later or call external APIs
        pass

    def suggest_improvements(self, current_seo: Dict[str, Optional[str]]) -> Dict[str, str]:
        title = current_seo.get("title", "")
        description = current_seo.get("description", "")
        keywords = current_seo.get("keywords", "")

        suggestions = {}

        if not title or len(title) < 20:
            suggestions["title"] = "Consider writing a more descriptive and keyword-rich title."

        if not description or len(description) < 50:
            suggestions["description"] = (
                "Your meta description is too short or missing. Try writing 150–160 characters that include primary keywords."
            )

        if not keywords:
            suggestions["keywords"] = (
                "No keywords found. Consider adding 5–10 relevant keywords that match your niche."
            )

        if title and "home" in title.lower():
            suggestions["title_specificity"] = (
                "Avoid generic words like 'home' — use specific keywords about your service or product."
            )

        if description and "welcome" in description.lower():
            suggestions["description_specificity"] = (
                "Avoid generic phrases like 'welcome to our site'. Focus on what value you offer."
            )

        if not suggestions:
            suggestions["message"] = "Your SEO metadata looks solid. Great job!"

        suggestions["evaluated_at"] = datetime.utcnow().isoformat()
        return suggestions
