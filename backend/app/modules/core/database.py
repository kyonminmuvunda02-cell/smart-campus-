import logging
from sqlalchemy import create_engine, text
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session, sessionmaker, DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, Boolean
from app.modules.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from sqlalchemy import event
from sqlalchemy.orm import with_loader_criteria

@event.listens_for(Session, "do_orm_execute")
def _add_filtering_criteria(execute_state):
    """Automatically filter out soft-deleted records from all SELECT queries, unless include_deleted=True is explicitly set."""
    if execute_state.is_select and not execute_state.is_column_load \
            and not execute_state.is_relationship_load \
            and not execute_state.execution_options.get("include_deleted", False):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                Base,
                lambda cls: cls.is_deleted == False,
                include_aliases=True
            )
        )

class Base(DeclarativeBase):
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


def get_db():
    """FastAPI dependency — yields a DB session and closes it after each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Probe the database with a lightweight SELECT 1.

    Used by the lifespan handler and the /health endpoint.
    Returns True if the connection succeeds, False otherwise.
    Never raises — always safe to call at startup.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning("Database health check failed: %s", exc)
        return False
