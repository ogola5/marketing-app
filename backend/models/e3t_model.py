# models/e3t_model.py

from pydantic import BaseModel

class E3TScore(BaseModel):
    expertise: float
    engagement: float
    trust: float
    total: float
    intent: str
    region: str
