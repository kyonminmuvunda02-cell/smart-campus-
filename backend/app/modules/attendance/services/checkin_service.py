import logging
import math
from datetime import datetime, timezone

from sqlalchemy import and_, func as sa_func, or_, select
from sqlalchemy.orm import Session

from app.modules.attendance.models.record import AttendanceRecord
from app.modules.attendance.models.session import AttendanceSession
from app.modules.attendance.schemas.attendance import AttendanceCheckIn, AttendanceRecordReviewUpdate
from app.modules.audit.services.audit_service import AuditService
from app.modules.core.config import settings
from app.modules.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.modules.digital_id.models.digital_id import DigitalID
from app.modules.enrollment.models.enrollment import Enrollment

logger = logging.getLogger(__name__)


class CheckInService:
    @staticmethod
    def get_record(db: Session, attendance_id: int) -> AttendanceRecord:
        record = db.execute(
            select(AttendanceRecord).where(AttendanceRecord.attendance_id == attendance_id)
        ).scalars().first()
        if not record:
            raise NotFoundException("Attendance record not found")
        return record

    @staticmethod
    def calculate_distance_meters(
        from_latitude: float,
        from_longitude: float,
        to_latitude: float,
        to_longitude: float,
    ) -> float:
        earth_radius_meters = 6_371_000
        lat1 = math.radians(from_latitude)
        lat2 = math.radians(to_latitude)
        delta_lat = math.radians(to_latitude - from_latitude)
        delta_lng = math.radians(to_longitude - from_longitude)

        a = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return earth_radius_meters * c

    @staticmethod
    def validate_geofence(session: AttendanceSession, data: AttendanceCheckIn) -> float:
        venue = session.venue
        if not venue or any(
            value is None for value in (venue.latitude, venue.longitude, venue.radius_meters)
        ):
            raise ConflictException("This session venue does not have a valid geofence configuration")

        distance_meters = CheckInService.calculate_distance_meters(
            from_latitude=data.gps_latitude,
            from_longitude=data.gps_longitude,
            to_latitude=venue.latitude,
            to_longitude=venue.longitude,
        )
        tolerated_radius = venue.radius_meters + min(
            data.gps_accuracy or 0,
            settings.GPS_MAX_TRUSTED_ACCURACY_METERS,
        )
        if distance_meters > tolerated_radius:
            raise ForbiddenException("You are outside the approved venue attendance zone")
        return distance_meters

    @staticmethod
    def process_checkin(
        db: Session, data: AttendanceCheckIn, student_id: int
    ) -> AttendanceRecord:
        """Process a student's QR code scan and record their attendance."""
        from app.modules.attendance.services.session_service import AttendanceSessionService

        session = AttendanceSessionService.get_active_session(db, data.session_id)
        if not session:
            raise NotFoundException("Attendance session not found or QR code has expired")
        if session.qr_code != data.qr_code:
            raise ForbiddenException("QR code is invalid or has been refreshed")

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
            raise ForbiddenException("No valid Digital ID found - contact the Registrar")

        distance_meters = CheckInService.validate_geofence(session, data)

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

        same_device = db.execute(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.session_id == data.session_id,
                    AttendanceRecord.device_id == data.device_id,
                    AttendanceRecord.student_id != student_id,
                )
            )
        ).scalars().first()
        if same_device:
            logger.warning(
                "Proxy scan detected",
                extra={
                    "attempted_student_id": student_id,
                    "session_id": data.session_id,
                    "shared_device_id": data.device_id,
                },
            )
            raise ForbiddenException(
                "Device Fingerprint Violation: This device has already been used to check in another student during this session."
            )

        fraud_flag = (
            data.gps_accuracy is None
            or data.gps_accuracy > settings.GPS_MAX_TRUSTED_ACCURACY_METERS
        )

        record = AttendanceRecord(
            session_id=data.session_id,
            student_id=student_id,
            device_id=data.device_id,
            gps_latitude=data.gps_latitude,
            gps_longitude=data.gps_longitude,
            gps_accuracy=data.gps_accuracy,
            verification_status="Verified" if not fraud_flag else "Pending",
            fraud_flag=fraud_flag,
        )
        db.add(record)
        db.flush()

        log_context = {
            "student_id": student_id,
            "session_id": data.session_id,
            "distance_meters": round(distance_meters, 2),
            "gps_accuracy": data.gps_accuracy,
        }
        if fraud_flag:
            logger.warning("Fraud flag set due to weak GPS confidence", extra=log_context)
        else:
            logger.info("Check-in recorded", extra=log_context)
        return record

    @staticmethod
    def list_records_for_session(
        db: Session, session_id: int, skip: int = 0, limit: int = 100
    ) -> dict:
        """Return all attendance records for a session (for lecturer's view)."""
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

    @staticmethod
    def list_review_queue(
        db: Session,
        *,
        reviewer_role: str,
        reviewer_user_id: int,
        verification_status: str | None = None,
        session_id: int | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        filters = [or_(AttendanceRecord.fraud_flag == True, AttendanceRecord.verification_status == "Pending")]

        if verification_status is not None:
            filters.append(AttendanceRecord.verification_status == verification_status)
        if session_id is not None:
            filters.append(AttendanceRecord.session_id == session_id)

        session_join_filters = []
        if reviewer_role == "Lecturer":
            session_join_filters.append(AttendanceSession.lecturer_id == reviewer_user_id)

        count_query = (
            select(sa_func.count())
            .select_from(AttendanceRecord)
            .join(AttendanceSession, AttendanceSession.session_id == AttendanceRecord.session_id)
            .where(*filters, *session_join_filters)
        )
        total = db.execute(count_query).scalar_one()

        rows = db.execute(
            select(AttendanceRecord, AttendanceSession)
            .join(AttendanceSession, AttendanceSession.session_id == AttendanceRecord.session_id)
            .where(*filters, *session_join_filters)
            .order_by(AttendanceRecord.checked_in_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()

        items = []
        for record, session in rows:
            items.append(
                {
                    "attendance_id": record.attendance_id,
                    "session_id": record.session_id,
                    "student_id": record.student_id,
                    "device_id": record.device_id,
                    "gps_latitude": record.gps_latitude,
                    "gps_longitude": record.gps_longitude,
                    "gps_accuracy": record.gps_accuracy,
                    "verification_status": record.verification_status,
                    "fraud_flag": record.fraud_flag,
                    "checked_in_at": record.checked_in_at,
                    "reviewed_by": record.reviewed_by,
                    "reviewed_at": record.reviewed_at,
                    "review_note": record.review_note,
                    "course_id": session.course_id,
                    "venue_id": session.venue_id,
                    "lecturer_id": session.lecturer_id,
                    "session_start": session.session_start,
                    "session_end": session.session_end,
                    "session_type": session.session_type,
                }
            )

        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def review_record(
        db: Session,
        attendance_id: int,
        data: AttendanceRecordReviewUpdate,
        reviewer_role: str,
        reviewer_user_id: int,
    ) -> AttendanceRecord:
        record = CheckInService.get_record(db, attendance_id)
        session = db.execute(
            select(AttendanceSession).where(AttendanceSession.session_id == record.session_id)
        ).scalars().first()
        if not session:
            raise NotFoundException("Attendance session not found")
        if reviewer_role == "Lecturer" and session.lecturer_id != reviewer_user_id:
            raise ForbiddenException("Lecturers can only review records for their own sessions")

        record.verification_status = data.verification_status
        record.review_note = data.review_note
        record.reviewed_by = reviewer_user_id
        record.reviewed_at = datetime.now(timezone.utc)
        record.fraud_flag = data.verification_status != "Verified"
        db.flush()

        AuditService.log(
            db,
            action="ATTENDANCE_REVIEWED",
            user_id=reviewer_user_id,
            table_name="attendancerecord",
            record_id=record.attendance_id,
            detail=f"{data.verification_status}: {data.review_note or 'No note'}",
        )
        return record
