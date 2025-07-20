import os
import requests
from dotenv import load_dotenv

load_dotenv()  # Load from .env

HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise EnvironmentError("Hugging Face token not found in .env file")

HF_API_HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

def query_huggingface_model(model_url: str, payload: dict):
    response = requests.post(model_url, headers=HF_API_HEADERS, json=payload)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"HuggingFace API error: {response.status_code} - {response.text}")
