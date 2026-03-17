import logging
import sys
from app.modules.core.config import settings


def setup_logging() -> None:
    """Configure root logger.

    - Development: human-readable format with colours via a simple formatter.
    - Production:  JSON-style single-line format suitable for log aggregators.
    """
    level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO

    fmt = (
        "%(levelname)-8s [%(name)s] %(message)s"
        if settings.ENVIRONMENT == "development"
        else "%(asctime)s %(levelname)s %(name)s %(message)s"
    )

    logging.basicConfig(
        level=level,
        format=fmt,
        datefmt="%H:%M:%S",
        stream=sys.stdout,
    )

    # Quiet down noisy third-party loggers
    for noisy in ("uvicorn.access", "sqlalchemy.engine", "passlib"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
