from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.core.database import Base
from datetime import datetime


class Lecturer(Base):
    __tablename__ = "lecturer"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("appuser.user_id", ondelete="CASCADE"), primary_key=True
    )
    staff_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    office_location: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["AppUser"] = relationship(back_populates="lecturer_profile")
    course_assignments: Mapped[list["CourseLecturer"]] = relationship(back_populates="lecturer")
    attendance_sessions: Mapped[list["AttendanceSession"]] = relationship(back_populates="lecturer")
