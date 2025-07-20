# routes/domain.py

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models.domain import DomainModel
from config.db import get_database
from services.domain_service import DomainService

router = APIRouter(prefix="/api/domain", tags=["Domain"])


@router.post("/", response_model=DomainModel)
async def create_domain(domain: DomainModel, db=Depends(get_database)):
    service = DomainService(db)
    return await service.create_domain(domain)


@router.get("/", response_model=List[DomainModel])
async def get_all_domains(db=Depends(get_database)):
    service = DomainService(db)
    return await service.get_all_domains()


@router.get("/{id}", response_model=DomainModel)
async def get_domain(id: str, db=Depends(get_database)):
    service = DomainService(db)
    return await service.get_domain_by_id(id)


@router.put("/{id}", response_model=DomainModel)
async def update_domain(id: str, domain_update: DomainModel, db=Depends(get_database)):
    service = DomainService(db)
    return await service.update_domain(id, domain_update)
