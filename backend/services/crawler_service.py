# services/crawler_service.py

import httpx
from bs4 import BeautifulSoup
from typing import Dict

class CrawlerService:
    def __init__(self, db=None):
        # Optional: db used for logging or rate-limiting
        self.db = db

    async def scrape_seo_data(self, url: str) -> Dict[str, str]:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(url)

            if response.status_code != 200:
                raise Exception(f"Failed to fetch page: {response.status_code}")

            soup = BeautifulSoup(response.text, "html.parser")

            seo_data = {
                "title": soup.title.string.strip() if soup.title else "",
                "description": "",
                "keywords": ""
            }

            for tag in soup.find_all("meta"):
                if tag.get("name") == "description":
                    seo_data["description"] = tag.get("content", "").strip()
                elif tag.get("name") == "keywords":
                    seo_data["keywords"] = tag.get("content", "").strip()

            return seo_data

        except Exception as e:
            return {"error": str(e)}
