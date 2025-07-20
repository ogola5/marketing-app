# routes/seo.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from config.database import db  # Updated import
from bson import ObjectId
import httpx
from bs4 import BeautifulSoup
from datetime import datetime

router = APIRouter(prefix="/api/seo", tags=["SEO"])

class SEORequest(BaseModel):
    url: HttpUrl

class SEOData(BaseModel):
    title: str | None = None
    description: str | None = None
    keywords: str | None = None
    og_image: str | None = None
    analyzed_at: datetime

@router.post("/analyze", response_model=SEOData)
async def analyze_seo(request: SEORequest):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(request.url)
            response.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")

    soup = BeautifulSoup(response.text, 'html.parser')

    seo_data = {
        "title": soup.title.string.strip() if soup.title and soup.title.string else None,
        "description": _get_meta_content(soup, "description"),
        "keywords": _get_meta_content(soup, "keywords"),
        "og_image": _get_meta_property(soup, "og:image"),
        "analyzed_at": datetime.utcnow()
    }

    # Update domain document in DB
    domain_collection = db["domains"]
    update_result = await domain_collection.update_one(
        {"url": str(request.url)},
        {"$set": {"seo_data": seo_data}}
    )

    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Matching domain not found in database")

    return seo_data


def _get_meta_content(soup: BeautifulSoup, name: str) -> str | None:
    tag = soup.find("meta", attrs={"name": name})
    return tag["content"].strip() if tag and tag.get("content") else None


def _get_meta_property(soup: BeautifulSoup, prop: str) -> str | None:
    tag = soup.find("meta", attrs={"property": prop})
    return tag["content"].strip() if tag and tag.get("content") else None