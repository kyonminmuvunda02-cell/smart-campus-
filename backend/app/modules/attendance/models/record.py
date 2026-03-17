from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean, Float, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.core.database import Base
from datetime import datetime


class AttendanceRecord(Base):
    __tablename__ = "attendancerecord"
    __table_args__ = (
        # DB-level guard: a student can only check in once per session
        UniqueConstraint("session_id", "student_id", name="uq_attendance_session_student"),
    )

    attendance_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("attendancesession.session_id", ondelete="RESTRICT"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student.user_id", ondelete="RESTRICT"), nullable=False
    )

    # GPS coordinates from the student's device at scan time
    gps_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    # NULL accuracy → device couldn't report it → fraud_flag is auto-set to TRUE
    gps_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)

    # 'Verified' | 'Pending' | 'Rejected'
    verification_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="Pending"
    )
    # Set TRUE when gps_accuracy is NULL — mirrors the DB trigger behaviour
    fraud_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    session: Mapped["AttendanceSession"] = relationship(back_populates="records")
    student: Mapped["Student"] = relationship(back_populates="attendance_records")
