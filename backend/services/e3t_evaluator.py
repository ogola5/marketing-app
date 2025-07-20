# services/e3t_evaluator.py

from typing import Dict
from models.e3t_model import E3TScore
from services.intent_matcher import IntentMatcher
from services.geo_intent_resolver import GeoIntentResolver

class E3TEvaluator:
    def __init__(self):
        self.intent_matcher = IntentMatcher()
        self.geo_resolver = GeoIntentResolver()

    def evaluate(self, metadata: Dict, user_query: str, request_headers: Dict) -> E3TScore:
        """
        metadata: dict containing title, meta, body content, schema, etc.
        user_query: user search input
        request_headers: for IP-based geo inference
        """
        intent = self.intent_matcher.match_intent(user_query)
        location_data = self.geo_resolver.resolve_geo_context(request_headers)

        expertise_score = self._score_expertise(metadata)
        engagement_score = self._score_engagement(metadata)
        trust_score = self._score_trust(metadata)

        total_score = (expertise_score + engagement_score + trust_score) / 3.0

        return E3TScore(
            expertise=expertise_score,
            engagement=engagement_score,
            trust=trust_score,
            total=round(total_score, 2),
            intent=intent,
            region=location_data.get("region") if location_data else "Unknown"
        )

    def _score_expertise(self, metadata: Dict) -> float:
        return 0.6 * int(bool(metadata.get("schema"))) + 0.4 * int("author" in metadata.get("schema", {}).get("@type", ""))

    def _score_engagement(self, metadata: Dict) -> float:
        return 0.5 + 0.5 * int("call_to_action" in metadata.get("body", "").lower())

    def _score_trust(self, metadata: Dict) -> float:
        domain_trust = 1.0 if "https://" in metadata.get("url", "") else 0.5
        return 0.5 + 0.5 * domain_trust
