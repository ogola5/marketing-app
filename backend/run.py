# run.py - Development server script
import uvicorn
from config import settings

if __name__ == "__main__":
    print(f"🚀 Starting {settings.app_name} Development Server")
    print(f"📍 URL: http://{settings.host}:{settings.port}")
    print(f"📚 API Docs: http://{settings.host}:{settings.port}/docs")
    print(f"🔧 ReDoc: http://{settings.host}:{settings.port}/redoc")
    print(f"💾 Database: {settings.db_name}")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        reload_dirs=[".", "config", "models", "routes", "services", "utils"],
        log_level="info"
    )