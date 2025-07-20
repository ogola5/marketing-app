# config/database.py
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from .settings import settings

# Create MongoDB connection
client = AsyncIOMotorClient(settings.mongo_url)
db = client[settings.db_name]

logger = logging.getLogger(__name__)

async def connect_to_mongo():
    """Create database connection"""
    try:
        # Test the connection
        await client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: {settings.db_name}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    try:
        client.close()
        logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # User indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("session_token")
        await db.users.create_index([("token_expires_at", 1)])  # Added for token expiration queries
        
        # OAuth states indexes (for CSRF protection)
        await db.oauth_states.create_index("state", unique=True)
        await db.oauth_states.create_index([("expires_at", 1)], expireAfterSeconds=0)  # Auto-delete expired states
        
        # Campaign indexes
        await db.campaigns.create_index([("user_id", 1), ("created_at", -1)])
        await db.campaigns.create_index("status")
        
        # Lead indexes
        await db.leads.create_index([("user_id", 1), ("status", 1)])
        await db.leads.create_index("campaign_id")
        await db.leads.create_index("email")
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")