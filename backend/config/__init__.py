# config/__init__.py
from .settings import settings
from .database import connect_to_mongo, close_mongo_connection, create_indexes,db

__all__ = [
    "settings",
    "connect_to_mongo",
    "close_mongo_connection",
    "create_indexes",
    "db"
]
