from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.modules.core.database import Base
from datetime import datetime


class AuditLog(Base):
    __tablename__ = "auditlog"

    log_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # nullable — system events (e.g. pg_cron sweep) may not have a user
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("appuser.user_id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    table_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    record_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    # AuditLog rows are immutable — created_at is set once and never updated
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
