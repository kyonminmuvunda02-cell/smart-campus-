from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.core.database import Base
from datetime import datetime


class Admin(Base):
    __tablename__ = "admin"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("appuser.user_id", ondelete="CASCADE"), primary_key=True
    )
    admin_level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["AppUser"] = relationship(back_populates="admin_profile")
