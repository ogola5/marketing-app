# models/e3t_model.py
from pydantic import BaseModel

class E3TModel(BaseModel):  # Renamed from E3TScore to E3TModel
    expertise: float
    engagement: float
    trust: float
    total: float
    intent: str
    region: str

__all__ = ['E3TModel']  # Updated to match the class name