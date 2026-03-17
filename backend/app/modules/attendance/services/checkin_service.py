import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.modules.attendance.models.record import AttendanceRecord
from app.modules.attendance.models.session import AttendanceSession
from app.modules.enrollment.models.enrollment import Enrollment
from app.modules.digital_id.models.digital_id import DigitalID
from app.modules.attendance.schemas.attendance import AttendanceCheckIn
from app.modules.core.exceptions import NotFoundException, ForbiddenException, ConflictException

logger = logging.getLogger(__name__)


class CheckInService:

    @staticmethod
    def process_checkin(
        db: Session, data: AttendanceCheckIn, student_id: int
    ) -> AttendanceRecord:
        """Process a student's QR code scan and record their attendance.

        Validation order mirrors the DB trigger step order exactly.
        If any step fails, an exception is raised and nothing is written.

          Step 1 — Session exists, is active, QR not expired
          Step 2 — Student enrolled in correct course/semester/year
          Step 3 — Student has a valid unexpired DigitalID
          Step 4 — No duplicate check-in for this session

        Args:
            db: Database session.
            data: Check-in payload (session_id + GPS coordinates).
            student_id: user_id of the currently authenticated student.

        Returns:
            The new AttendanceRecord — flushed, not committed.
        """
        from app.modules.attendance.services.session_service import AttendanceSessionService

        # Step 1: Confirm the session is still live.
        # The QR may have expired between the student scanning and the request arriving.
        session = AttendanceSessionService.get_active_session(db, data.session_id)
        if not session:
            raise NotFoundException("Attendance session not found or QR code has expired")

        # Step 2: Student must be enrolled in this exact course/semester/year.
        enrolled = db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.course_id == session.course_id,
                    Enrollment.enrollment_status == "Enrolled",
                    Enrollment.semester == session.semester,
                    Enrollment.academic_year == session.academic_year,
                )
            )
        ).scalars().first()
        if not enrolled:
            raise ForbiddenException("You are not enrolled in this course for this semester")

        # Step 3: Student must hold a currently valid DigitalID.
        digital_id = db.execute(
            select(DigitalID).where(
                and_(
                    DigitalID.student_id == student_id,
                    DigitalID.is_active == True,
                    DigitalID.expires_at > datetime.now(timezone.utc),
                )
            )
        ).scalars().first()
        if not digital_id:
            raise ForbiddenException("No valid Digital ID found — contact the Registrar")

        # Step 4: Duplicate check — UNIQUE(session_id, student_id) in DB also catches this,
        # but checking here gives a user-friendly 409 instead of a 500.
        existing = db.execute(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.session_id == data.session_id,
                    AttendanceRecord.student_id == student_id,
                )
            )
        ).scalars().first()
        if existing:
            raise ConflictException("You have already checked in to this session")

        # fraud_flag is set when GPS accuracy is missing — device cannot prove physical presence
        fraud_flag = data.gps_accuracy is None

        record = AttendanceRecord(
            session_id=data.session_id,
            student_id=student_id,
            gps_latitude=data.gps_latitude,
            gps_longitude=data.gps_longitude,
            gps_accuracy=data.gps_accuracy,
            verification_status="Verified" if not fraud_flag else "Pending",
            fraud_flag=fraud_flag,
        )
        db.add(record)
        db.flush()

        if fraud_flag:
            logger.warning("Fraud flag set — GPS accuracy missing", extra={
                "student_id": student_id,
                "session_id": data.session_id,
            })
        else:
            logger.info("Check-in recorded", extra={
                "student_id": student_id,
                "session_id": data.session_id,
            })
        return record

    @staticmethod
    def list_records_for_session(
        db: Session, session_id: int, skip: int = 0, limit: int = 100
    ) -> dict:
        """Return all attendance records for a session (for lecturer's view)."""
        from sqlalchemy import func as sa_func
        total = db.execute(
            select(sa_func.count()).select_from(AttendanceRecord).where(
                AttendanceRecord.session_id == session_id
            )
        ).scalar_one()
        items = db.execute(
            select(AttendanceRecord)
            .where(AttendanceRecord.session_id == session_id)
            .order_by(AttendanceRecord.checked_in_at)
            .offset(skip)
            .limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def list_records_for_student(
        db: Session, student_id: int, skip: int = 0, limit: int = 20
    ) -> dict:
        """Return all attendance records for a student (their own history)."""
        from sqlalchemy import func as sa_func
        total = db.execute(
            select(sa_func.count()).select_from(AttendanceRecord).where(
                AttendanceRecord.student_id == student_id
            )
        ).scalar_one()
        items = db.execute(
            select(AttendanceRecord)
            .where(AttendanceRecord.student_id == student_id)
            .order_by(AttendanceRecord.checked_in_at.desc())
            .offset(skip)
            .limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}
