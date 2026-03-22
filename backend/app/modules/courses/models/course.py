from sqlalchemy import String, Integer, DateTime, func, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.core.database import Base
from datetime import datetime


class Course(Base):
    __tablename__ = "course"

    course_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    course_name: Mapped[str] = mapped_column(String(200), nullable=False)
    credits: Mapped[int] = mapped_column(Integer, nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    minimum_attendance_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=80)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    lecturer_assignments: Mapped[list["CourseLecturer"]] = relationship(back_populates="course")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="course")
    attendance_sessions: Mapped[list["AttendanceSession"]] = relationship(back_populates="course")


class CourseLecturer(Base):
    __tablename__ = "courselecturer"

    # Composite PK — a lecturer can only be assigned to a course once
    lecturer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lecturer.user_id", ondelete="CASCADE"), primary_key=True
    )
    course_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("course.course_id", ondelete="CASCADE"), primary_key=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    lecturer: Mapped["Lecturer"] = relationship(back_populates="course_assignments")
    course: Mapped["Course"] = relationship(back_populates="lecturer_assignments")
