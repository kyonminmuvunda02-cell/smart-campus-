from sqlalchemy import String, Integer, DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.core.database import Base
from datetime import datetime


class Venue(Base):
    __tablename__ = "venue"

    venue_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    venue_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    building: Mapped[str | None] = mapped_column(String(100), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    radius_meters: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    attendance_sessions: Mapped[list["AttendanceSession"]] = relationship(back_populates="venue")
