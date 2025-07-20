# services/intent_matcher.py

from typing import Optional

class IntentMatcher:
    def __init__(self):
        self.intent_keywords = {
            "grocery": ["buy food", "grocery", "supermarket", "shop food"],
            "healthcare": ["chemist", "hospital", "clinic", "doctor", "pharmacy"],
            "shopping": ["buy shoes", "clothes", "fashion", "retail", "market"],
            "financial": ["mpesa", "bank", "send money", "withdraw", "finance"],
            "transport": ["matatu", "bus", "boda", "taxi", "ride", "uber"]
        }

    def match_intent(self, query: str) -> Optional[str]:
        query_lower = query.lower()
        for category, keywords in self.intent_keywords.items():
            if any(kw in query_lower for kw in keywords):
                return category
        return "general"
