from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modules.core.database import Base


class TimetableEntry(Base):
    __tablename__ = "timetableentry"

    timetable_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("course.course_id", ondelete="RESTRICT"), nullable=False
    )
    lecturer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lecturer.user_id", ondelete="RESTRICT"), nullable=False
    )
    venue_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("venue.venue_id", ondelete="RESTRICT"), nullable=False
    )
    weekday: Mapped[str] = mapped_column(String(12), nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    session_type: Mapped[str] = mapped_column(String(30), nullable=False, default="Lecture")
    semester: Mapped[str] = mapped_column(String(20), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(9), nullable=False)
    effective_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    effective_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    course: Mapped["Course"] = relationship()
    lecturer: Mapped["Lecturer"] = relationship()
    venue: Mapped["Venue"] = relationship()
