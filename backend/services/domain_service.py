# services/domain_service.py

from typing import List, Optional
from models.domain import DomainModel
from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime
from fastapi.encoders import jsonable_encoder

class DomainService:
    def __init__(self, db):
        self.collection = db["domains"]

    async def create_domain(self, domain: DomainModel) -> dict:
        now = datetime.utcnow()
        domain.created_at = now
        domain.updated_at = now
        domain.scraped_at = now

        doc = jsonable_encoder(domain)
        result = await self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc

    async def get_all_domains(self) -> List[dict]:
        cursor = self.collection.find()
        return await cursor.to_list(length=100)

    async def get_domain_by_id(self, domain_id: str) -> dict:
        try:
            oid = ObjectId(domain_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid domain ID format")

        domain = await self.collection.find_one({"_id": oid})
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
        return domain

    async def get_domain_by_url(self, url: str) -> dict:
        domain = await self.collection.find_one({"url": url})
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found by URL")
        return domain

    async def update_domain(self, domain_id: str, updates: DomainModel) -> dict:
        try:
            oid = ObjectId(domain_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid domain ID format")

        updates.updated_at = datetime.utcnow()
        update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}

        result = await self.collection.update_one({"_id": oid}, {"$set": update_data})

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Domain not found or no changes applied")

        updated_domain = await self.collection.find_one({"_id": oid})
        return updated_domain

    async def update_seo_data(self, url: str, seo_data: dict) -> dict:
        result = await self.collection.update_one(
            {"url": url},
            {"$set": {"seo_data": seo_data, "updated_at": datetime.utcnow()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="No domain found to update SEO data")
        return await self.collection.find_one({"url": url})
