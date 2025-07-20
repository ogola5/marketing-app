# utils/schema_generator.py
import json
import re
from utils.hf_api import query_huggingface_model

HF_SCHEMA_GEN_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"

class SchemaGenerator:
    def __init__(self):
        pass  # Add initialization logic if needed

    def generate_local_schema(self, business_info: dict, region: str, use_ai: bool = False) -> str:
        if not use_ai:
            schema = {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": business_info.get("name"),
                "image": business_info.get("image_url", ""),
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": region,
                    "addressCountry": "KE"
                },
                "telephone": business_info.get("phone"),
                "url": business_info.get("url"),
                "description": business_info.get("description", ""),
                "priceRange": "$$",
                "servesCuisine": business_info.get("category", ""),
                "sameAs": business_info.get("social_links", [])
            }
            return json.dumps(schema, indent=2)

        # AI-based schema generation
        prompt = f"""
Generate a structured JSON-LD schema.org markup for a local business below:

Business Info:
{json.dumps(business_info, indent=2)}
Region: {region}

Return only JSON:
"""
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 200,
                "temperature": 0.5
            }
        }

        try:
            result = query_huggingface_model(HF_SCHEMA_GEN_URL, payload)
            generated = result[0]["generated_text"]
            json_text = re.search(r"\{.*\}", generated, re.DOTALL)
            return json_text.group() if json_text else '{"error": "No valid JSON detected"}'
        except Exception as e:
            return json.dumps({"error": str(e)})

__all__ = ['SchemaGenerator']