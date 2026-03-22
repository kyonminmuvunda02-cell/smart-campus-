import uvicorn

from app.main import app
from app.modules.core.config import settings


if __name__ == "__main__":
    app_target = "app.main:app"
    uvicorn.run(
        app_target,
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
