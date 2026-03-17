from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.core.database import Base
from datetime import datetime


class Enrollment(Base):
    __tablename__ = "enrollment"

    # Composite PK — (student_id, course_id, semester, academic_year) must be unique.
    # Prevents a student from enrolling in the same course twice in the same period.
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student.user_id", ondelete="CASCADE"), primary_key=True
    )
    course_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("course.course_id", ondelete="CASCADE"), primary_key=True
    )
    semester: Mapped[str] = mapped_column(String(20), primary_key=True)
    academic_year: Mapped[str] = mapped_column(String(9), primary_key=True)

    # Constrained to: 'Enrolled' | 'Dropped' | 'Completed'
    enrollment_status: Mapped[str] = mapped_column(String(20), nullable=False, default="Enrolled")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    student: Mapped["Student"] = relationship(back_populates="enrollments")
    course: Mapped["Course"] = relationship(back_populates="enrollments")
