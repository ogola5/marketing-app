# routes/__init__.py
from .auth import router as auth_router
from .campaigns import router as campaigns_router
from .leads import router as leads_router
from .dashboard import router as dashboard_router
from .system import router as system_router

__all__ = [
    "auth_router",
    "campaigns_router", 
    "leads_router",
    "dashboard_router",
    "system_router"
]