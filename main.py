from pathlib import Path
import os
import sys

import uvicorn


PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"

# Make root-level `python main.py` behave like running from `backend/`.
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))

from app.modules.core.config import settings  # noqa: E402


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
