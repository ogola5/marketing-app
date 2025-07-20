# services/injection_engine.py

from utils.schema_generator import generate_local_schema
from utils.content_optimizer import optimize_content

class InjectionEngine:
    def __init__(self):
        pass

    def inject_keywords_and_schema(self, content: str, business_info: dict, region: str) -> dict:
        """
        Optimizes and injects keywords + Schema markup into the site metadata
        content: original body or HTML content
        business_info: includes type, name, service category
        region: location like 'Kilifi' or 'Mombasa'
        """
        optimized = optimize_content(content, region=region, category=business_info.get("category"))
        schema = generate_local_schema(business_info, region)

        return {
            "optimized_content": optimized,
            "schema_markup": schema,
            "seo_tags": {
                "title": f"{business_info['name']} in {region} | Trusted {business_info['category']}",
                "meta_description": f"Discover {business_info['name']}, a top-rated {business_info['category']} service near you in {region}. Fast, reliable, and trusted.",
                "keywords": f"{business_info['category']}, {region} services, local {business_info['category']}, near me"
            }
        }
