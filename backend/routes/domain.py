# routes/domain.py
from fastapi import APIRouter, HTTPException
from typing import List
from models.domain import DomainModel
from config.database import db  # Using your existing database connection
from services.domain_service import DomainService
from bson import ObjectId

router = APIRouter(prefix="/api/domain", tags=["Domain"])

@router.post("/", response_model=DomainModel)
async def create_domain(domain: DomainModel):
    try:
        service = DomainService(db)
        return await service.create_domain(domain)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[DomainModel])
async def get_all_domains():
    service = DomainService(db)
    return await service.get_all_domains()

@router.get("/{id}", response_model=DomainModel)
async def get_domain(id: str):
    try:
        service = DomainService(db)
        return await service.get_domain_by_id(id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{id}", response_model=DomainModel)
async def update_domain(id: str, domain_update: DomainModel):
    try:
        service = DomainService(db)
        return await service.update_domain(id, domain_update)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))