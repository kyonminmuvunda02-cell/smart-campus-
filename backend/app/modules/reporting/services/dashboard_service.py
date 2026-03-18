from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.attendance.models.record import AttendanceRecord
from app.modules.attendance.models.session import AttendanceSession
from app.modules.attendance.models.timetable import TimetableEntry
from app.modules.audit.models.audit_log import AuditLog
from app.modules.courses.models.course import Course
from app.modules.digital_id.models.digital_id import DigitalID
from app.modules.enrollment.models.enrollment import Enrollment
from app.modules.reporting.schemas.dashboard import (
    AdminDashboardSummary,
    AuditActivityItem,
    DashboardSummaryResponse,
    LecturerDashboardSummary,
    LecturerLiveSessionSummary,
    LecturerReviewItem,
    LecturerUpcomingSessionItem,
    StudentAttendanceItem,
    StudentDashboardSummary,
    StudentEnrollmentItem,
)
from app.modules.users.models.user import AppUser
from app.modules.venues.models.venue import Venue


def _full_name(first_name: str | None, last_name: str | None, fallback: str) -> str:
    full_name = f"{first_name or ''} {last_name or ''}".strip()
    return full_name or fallback


class DashboardReportingService:
    @staticmethod
    def get_dashboard_summary(db: Session, *, user_id: int, role: str) -> DashboardSummaryResponse:
        if role == "Student":
            return DashboardSummaryResponse(role=role, student=DashboardReportingService._student_summary(db, user_id))
        if role == "Lecturer":
            return DashboardSummaryResponse(role=role, lecturer=DashboardReportingService._lecturer_summary(db, user_id))
        return DashboardSummaryResponse(role=role, admin=DashboardReportingService._admin_summary(db))

    @staticmethod
    def _student_summary(db: Session, user_id: int) -> StudentDashboardSummary:
        recent_rows = db.execute(
            select(AttendanceRecord, AttendanceSession, Course)
            .join(AttendanceSession, AttendanceSession.session_id == AttendanceRecord.session_id)
            .join(Course, Course.course_id == AttendanceSession.course_id)
            .where(AttendanceRecord.student_id == user_id)
            .order_by(AttendanceRecord.checked_in_at.desc())
            .limit(4)
        ).all()
        recent_attendance = [
            StudentAttendanceItem(
                attendance_id=record.attendance_id,
                session_id=record.session_id,
                session_type=session.session_type,
                course_label=f"{course.course_code} - {course.course_name}",
                checked_in_at=record.checked_in_at,
                verification_status=record.verification_status,
                fraud_flag=record.fraud_flag,
            )
            for record, session, course in recent_rows
        ]

        enrollment_rows = db.execute(
            select(Enrollment, Course)
            .join(Course, Course.course_id == Enrollment.course_id)
            .where(
                Enrollment.student_id == user_id,
                Enrollment.enrollment_status == "Enrolled",
            )
            .order_by(Enrollment.created_at.desc())
            .limit(4)
        ).all()
        enrollments = [
            StudentEnrollmentItem(
                course_id=enrollment.course_id,
                course_label=f"{course.course_code} - {course.course_name}",
                semester=enrollment.semester,
                academic_year=enrollment.academic_year,
            )
            for enrollment, course in enrollment_rows
        ]

        records_count = db.scalar(
            select(func.count()).select_from(AttendanceRecord).where(AttendanceRecord.student_id == user_id)
        ) or 0
        verified_count = db.scalar(
            select(func.count()).select_from(AttendanceRecord).where(
                AttendanceRecord.student_id == user_id,
                AttendanceRecord.fraud_flag == False,
                AttendanceRecord.verification_status == "Verified",
            )
        ) or 0
        flagged_count = db.scalar(
            select(func.count()).select_from(AttendanceRecord).where(
                AttendanceRecord.student_id == user_id,
                (AttendanceRecord.fraud_flag == True) | (AttendanceRecord.verification_status != "Verified"),
            )
        ) or 0
        active_enrollments = db.scalar(
            select(func.count()).select_from(Enrollment).where(
                Enrollment.student_id == user_id,
                Enrollment.enrollment_status == "Enrolled",
            )
        ) or 0
        active_id = db.execute(
            select(DigitalID)
            .where(
                DigitalID.student_id == user_id,
                DigitalID.is_active == True,
            )
            .order_by(DigitalID.expires_at.desc())
            .limit(1)
        ).scalars().first()

        return StudentDashboardSummary(
            records_count=records_count,
            verified_count=verified_count,
            flagged_count=flagged_count,
            active_enrollments=active_enrollments,
            digital_id_active=active_id is not None,
            digital_id_expires_at=active_id.expires_at if active_id else None,
            recent_attendance=recent_attendance,
            enrollments=enrollments,
        )

    @staticmethod
    def _lecturer_summary(db: Session, user_id: int) -> LecturerDashboardSummary:
        now = datetime.now(timezone.utc)
        sessions = db.execute(
            select(AttendanceSession, Course, Venue)
            .join(Course, Course.course_id == AttendanceSession.course_id)
            .join(Venue, Venue.venue_id == AttendanceSession.venue_id)
            .where(AttendanceSession.lecturer_id == user_id)
            .order_by(AttendanceSession.session_start.desc())
            .limit(12)
        ).all()

        live_rows = [row for row in sessions if row[0].is_active]
        live_row = live_rows[0] if live_rows else None
        live_session = None
        live_records = 0
        live_pending = 0
        if live_row:
            session, course, venue = live_row
            live_records = db.scalar(
                select(func.count()).select_from(AttendanceRecord).where(AttendanceRecord.session_id == session.session_id)
            ) or 0
            live_pending = db.scalar(
                select(func.count()).select_from(AttendanceRecord).where(
                    AttendanceRecord.session_id == session.session_id,
                    AttendanceRecord.verification_status == "Pending",
                )
            ) or 0
            live_session = LecturerLiveSessionSummary(
                session_id=session.session_id,
                session_type=session.session_type,
                course_label=f"{course.course_code} - {course.course_name}",
                venue_label=venue.venue_name,
                timetable_slot=session.timetable_slot,
                session_start=session.session_start,
                session_end=session.session_end,
                live_records=live_records,
                pending_reviews=live_pending,
            )

        upcoming_sessions = [
            LecturerUpcomingSessionItem(
                session_id=session.session_id,
                course_label=f"{course.course_code} - {course.course_name}",
                timetable_slot=session.timetable_slot,
                session_start=session.session_start,
            )
            for session, course, _venue in sessions
            if session.session_start > now and not session.is_active
        ][:3]

        review_rows = db.execute(
            select(AttendanceRecord, AttendanceSession, Course, AppUser)
            .join(AttendanceSession, AttendanceSession.session_id == AttendanceRecord.session_id)
            .join(Course, Course.course_id == AttendanceSession.course_id)
            .join(AppUser, AppUser.user_id == AttendanceRecord.student_id)
            .where(
                AttendanceSession.lecturer_id == user_id,
                AttendanceRecord.verification_status == "Pending",
            )
            .order_by(AttendanceRecord.checked_in_at.desc())
            .limit(4)
        ).all()
        review_queue = [
            LecturerReviewItem(
                attendance_id=record.attendance_id,
                student_name=_full_name(student.first_name, student.last_name, student.email),
                course_label=f"{course.course_code} - {course.course_name}",
                gps_accuracy=record.gps_accuracy,
                verification_status=record.verification_status,
            )
            for record, _session, course, student in review_rows
        ]

        active_session_count = db.scalar(
            select(func.count()).select_from(AttendanceSession).where(
                AttendanceSession.lecturer_id == user_id,
                AttendanceSession.is_active == True,
            )
        ) or 0
        open_review_items = db.scalar(
            select(func.count()).select_from(AttendanceRecord)
            .join(AttendanceSession, AttendanceSession.session_id == AttendanceRecord.session_id)
            .where(
                AttendanceSession.lecturer_id == user_id,
                AttendanceRecord.verification_status == "Pending",
            )
        ) or 0
        timetable_slots = db.scalar(
            select(func.count()).select_from(TimetableEntry).where(
                TimetableEntry.lecturer_id == user_id,
                TimetableEntry.is_active == True,
            )
        ) or 0
        current_verified_rate = 0
        if live_records:
            current_verified_rate = round(((live_records - live_pending) / live_records) * 100)

        return LecturerDashboardSummary(
            active_session_count=active_session_count,
            current_verified_rate=current_verified_rate,
            open_review_items=open_review_items,
            timetable_slots=timetable_slots,
            live_session=live_session,
            upcoming_sessions=upcoming_sessions,
            review_queue=review_queue,
        )

    @staticmethod
    def _admin_summary(db: Session) -> AdminDashboardSummary:
        active_identities = db.scalar(select(func.count()).select_from(AppUser)) or 0
        geofenced_venues = db.scalar(
            select(func.count()).select_from(Venue).where(
                Venue.latitude.is_not(None),
                Venue.longitude.is_not(None),
                Venue.radius_meters.is_not(None),
            )
        ) or 0
        total_venues = db.scalar(select(func.count()).select_from(Venue)) or 0
        open_exceptions = db.scalar(
            select(func.count()).select_from(AttendanceRecord).where(AttendanceRecord.verification_status == "Pending")
        ) or 0
        live_sessions = db.scalar(
            select(func.count()).select_from(AttendanceSession).where(AttendanceSession.is_active == True)
        ) or 0

        audit_rows = db.execute(
            select(AuditLog, AppUser)
            .outerjoin(AppUser, AppUser.user_id == AuditLog.user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(4)
        ).all()
        latest_audit = [
            AuditActivityItem(
                log_id=log.log_id,
                action=log.action,
                actor_name=_full_name(user.first_name, user.last_name, user.email) if user else None,
                table_name=log.table_name,
                record_id=log.record_id,
                detail=log.detail,
                created_at=log.created_at,
            )
            for log, user in audit_rows
        ]

        return AdminDashboardSummary(
            active_identities=active_identities,
            geofenced_venues=geofenced_venues,
            total_venues=total_venues,
            open_exceptions=open_exceptions,
            live_sessions=live_sessions,
            latest_audit=latest_audit,
        )
