from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.core.database import Base
from datetime import datetime
import uuid


class AttendanceSession(Base):
    __tablename__ = "attendancesession"

    session_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("course.course_id", ondelete="RESTRICT"), nullable=False
    )
    lecturer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lecturer.user_id", ondelete="RESTRICT"), nullable=False
    )
    venue_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("venue.venue_id", ondelete="RESTRICT"), nullable=False
    )
    session_type: Mapped[str] = mapped_column(String(30), nullable=False, default="Lecture")
    timetable_slot: Mapped[str | None] = mapped_column(String(100), nullable=True)
    session_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    session_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Semester and academic_year must match Enrollment values exactly —
    # validated on AttendanceRecord INSERT by the DB trigger.
    semester: Mapped[str] = mapped_column(String(20), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(9), nullable=False)

    # UUID encoded into the QR image — UNIQUE across all sessions
    qr_code: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, unique=True)

    # QR codes expire 30–60 seconds after generation to prevent screenshot sharing.
    # IMPORTANT: Never rely on is_active alone — always also check qr_code_expiry > now()
    qr_code_expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    course: Mapped["Course"] = relationship(back_populates="attendance_sessions")
    lecturer: Mapped["Lecturer"] = relationship(back_populates="attendance_sessions")
    venue: Mapped["Venue"] = relationship(back_populates="attendance_sessions")
    records: Mapped[list["AttendanceRecord"]] = relationship(back_populates="session")
