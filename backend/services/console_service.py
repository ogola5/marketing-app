# services/console_service.py

from services.domain_service import DomainService
from services.crawler_service import CrawlerService
from fastapi import HTTPException
from typing import Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.seo_brainstorm.py import SEOBrainstormService

seo_brain = SEOBrainstormService()
improvements = seo_brain.suggest_improvements({
    "title": "Home",
    "description": "Welcome to our homepage.",
    "keywords": ""
})

class ConsoleService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.domain_service = DomainService(db)
        self.crawler_service = CrawlerService(db)

    async def crawl_domain_now(self, domain_id: str) -> dict:
        domain = await self.domain_service.get_domain_by_id(domain_id)
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")

        seo_data = await self.crawler_service.scrape_seo_data(domain["url"])
        updated_domain = await self.domain_service.update_seo_data(domain["url"], seo_data)
        return updated_domain

    async def delete_all_domains(self) -> dict:
        result = await self.domain_service.collection.delete_many({})
        return {"deleted_count": result.deleted_count}
