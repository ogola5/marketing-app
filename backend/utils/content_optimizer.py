# utils/content_optimizer.py
from utils.hf_api import query_huggingface_model

HF_TEXT_GEN_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"

class ContentOptimizer:
    def __init__(self):
        pass  # Optional: Add initialization logic if needed

    def optimize_content(self, content: str, region: str, category: str, use_ai: bool = False) -> str:
        if not use_ai:
            # Light, local version
            seo_intro = f"Looking for trusted {category} services in {region}? You're in the right place.\n\n"
            content += f"\n\nOur {category} services in {region} are affordable, reliable, and tailored for your needs."
            content += f" Whether you're in {region} or nearby, our expert team is here to help."
            return seo_intro + content

        # AI-enhanced version
        prompt = f"Improve this business content for SEO:\n\n{content}\n\nOptimized:"
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 300,
                "temperature": 0.7
            }
        }
        try:
            result = query_huggingface_model(HF_TEXT_GEN_URL, payload)
            return result[0]["generated_text"]
        except Exception as e:
            return f"AI Optimization failed: {str(e)}"

__all__ = ['ContentOptimizer']  # Export the class