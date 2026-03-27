import uuid
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func as sa_func

from app.modules.attendance.models.session import AttendanceSession
from app.modules.attendance.schemas.attendance import (
    AttendanceSessionCreate, AttendanceSessionUpdate,
)
from app.modules.attendance.services.qr_service import QRCodeService
from app.modules.core.config import settings
from app.modules.core.exceptions import NotFoundException, ForbiddenException, ConflictException

logger = logging.getLogger(__name__)


class AttendanceSessionService:

    @staticmethod
    def _assert_no_schedule_conflict(
        db: Session,
        lecturer_id: int,
        venue_id: int,
        session_start: datetime,
        session_end: datetime,
        exclude_session_id: int | None = None,
    ) -> None:
        # Only check against sessions that haven't ended yet.
        # Past sessions (even if never explicitly closed) should not block new scheduling.
        now = datetime.now(timezone.utc)
        overlap_conditions = [
            AttendanceSession.session_start < session_end,
            AttendanceSession.session_end > session_start,
            AttendanceSession.session_end > now,
        ]
        if exclude_session_id is not None:
            overlap_conditions.append(AttendanceSession.session_id != exclude_session_id)

        lecturer_conflict = db.execute(
            select(AttendanceSession).where(
                AttendanceSession.lecturer_id == lecturer_id,
                *overlap_conditions,
            )
        ).scalars().first()
        if lecturer_conflict:
            raise ConflictException("This lecturer already has another session scheduled in that time window")

        venue_conflict = db.execute(
            select(AttendanceSession).where(
                AttendanceSession.venue_id == venue_id,
                *overlap_conditions,
            )
        ).scalars().first()
        if venue_conflict:
            raise ConflictException("This venue is already reserved for another session in that time window")

    @staticmethod
    def create_session(
        db: Session, data: AttendanceSessionCreate, lecturer_id: int
    ) -> AttendanceSession:
        """Create a new attendance session with a fresh time-limited QR code.

        Args:
            db: Database session.
            data: Validated session creation data.
            lecturer_id: user_id of the lecturer opening the session.

        Returns:
            The new AttendanceSession — flushed, not committed.
        """
        from app.modules.courses.services.course_service import CourseService
        from app.modules.venues.services.venue_service import VenueService

        CourseService.assert_lecturer_assigned(db, lecturer_id, data.course_id)
        venue = VenueService.get_venue(db, data.venue_id)
        VenueService.require_geofence(venue)
        AttendanceSessionService._assert_no_schedule_conflict(
            db,
            lecturer_id=lecturer_id,
            venue_id=data.venue_id,
            session_start=data.session_start,
            session_end=data.session_end,
        )

        qr_code = uuid.uuid4()
        # Scheduled sessions are created inactive; the first real QR is issued only when the lecturer starts attendance.
        qr_expiry = datetime.now(timezone.utc)

        session = AttendanceSession(
            course_id=data.course_id,
            lecturer_id=lecturer_id,
            venue_id=data.venue_id,
            session_type=data.session_type,
            session_start=data.session_start,
            session_end=data.session_end,
            semester=data.semester,
            academic_year=data.academic_year,
            qr_code=qr_code,
            qr_code_expiry=qr_expiry,
            is_active=False,
        )
        db.add(session)
        db.flush()
        logger.info("Attendance session created", extra={"session_id": session.session_id})
        return session

    @staticmethod
    def start_session(db: Session, session_id: int, lecturer_id: int) -> AttendanceSession:
        """Activate a scheduled session and issue the first live QR code."""
        from app.modules.venues.services.venue_service import VenueService

        session = AttendanceSessionService.get_session(db, session_id)
        if session.lecturer_id != lecturer_id:
            raise ForbiddenException("Only the session's lecturer can start it")
        if session.is_active:
            raise ConflictException("Session is already active")
        if session.session_end <= datetime.now(timezone.utc):
            raise ForbiddenException("Cannot start a session whose scheduled end time has passed")
        VenueService.require_geofence(session.venue)

        # Starting the session rotates in the first live QR so lecturers do not need a second action before display.
        session.is_active = True
        session.qr_code = uuid.uuid4()
        session.qr_code_expiry = datetime.now(timezone.utc) + timedelta(
            seconds=settings.QR_CODE_TTL_SECONDS
        )
        db.flush()
        logger.info("Session started", extra={"session_id": session_id})
        return session

    @staticmethod
    def refresh_qr(db: Session, session_id: int, lecturer_id: int) -> AttendanceSession:
        """Generate a fresh QR code for an existing active session.

        Only the lecturer who owns the session may refresh it.
        The old UUID is replaced — any student who scanned the old code
        cannot reuse it.

        Args:
            db: Database session.
            session_id: The session to refresh.
            lecturer_id: Must match the session's lecturer_id.

        Returns:
            Updated AttendanceSession — flushed, not committed.
        """
        session = db.execute(
            select(AttendanceSession).where(AttendanceSession.session_id == session_id)
        ).scalars().first()
        if not session:
            raise NotFoundException("Attendance session not found")
        if session.lecturer_id != lecturer_id:
            raise ForbiddenException("Only the session's lecturer can refresh its QR code")
        if not session.is_active:
            raise ForbiddenException("Cannot refresh QR on a closed session")

        session.qr_code = uuid.uuid4()
        session.qr_code_expiry = datetime.now(timezone.utc) + timedelta(
            seconds=settings.QR_CODE_TTL_SECONDS
        )
        db.flush()
        logger.info("QR code refreshed", extra={"session_id": session_id})
        return session

    @staticmethod
    def get_session(db: Session, session_id: int) -> AttendanceSession:
        """Fetch an AttendanceSession by ID. Raises 404 if not found."""
        session = db.execute(
            select(AttendanceSession).where(AttendanceSession.session_id == session_id)
        ).scalars().first()
        if not session:
            raise NotFoundException("Attendance session not found")
        return session

    @staticmethod
    def get_active_session(db: Session, session_id: int) -> AttendanceSession | None:
        """Fetch a session only if it is active AND its QR code has not expired.

        Belt-and-suspenders: always check both is_active and qr_code_expiry
        because pg_cron may not have run since the QR expired.
        """
        now = datetime.now(timezone.utc)
        return db.execute(
            select(AttendanceSession).where(
                and_(
                    AttendanceSession.session_id == session_id,
                    AttendanceSession.is_active == True,
                    AttendanceSession.qr_code_expiry > now,
                )
            )
        ).scalars().first()

    @staticmethod
    def list_sessions(db: Session, skip: int = 0, limit: int = 20) -> dict:
        """Return paginated list of all sessions (newest first)."""
        total = db.execute(
            select(sa_func.count()).select_from(AttendanceSession)
        ).scalar_one()
        items = db.execute(
            select(AttendanceSession)
            .order_by(AttendanceSession.session_start.desc())
            .offset(skip)
            .limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def list_sessions_for_lecturer(
        db: Session, lecturer_id: int, skip: int = 0, limit: int = 20
    ) -> dict:
        """Return paginated sessions for a specific lecturer."""
        total = db.execute(
            select(sa_func.count()).select_from(AttendanceSession).where(
                AttendanceSession.lecturer_id == lecturer_id
            )
        ).scalar_one()
        items = db.execute(
            select(AttendanceSession)
            .where(AttendanceSession.lecturer_id == lecturer_id)
            .order_by(AttendanceSession.session_start.desc())
            .offset(skip)
            .limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def update_session(
        db: Session, session_id: int, data: AttendanceSessionUpdate
    ) -> AttendanceSession:
        """Update a scheduled class before attendance goes live."""
        from app.modules.courses.services.course_service import CourseService
        from app.modules.venues.services.venue_service import VenueService

        session = AttendanceSessionService.get_session(db, session_id)

        now = datetime.now(timezone.utc)
        if session.is_active or session.session_start <= now:
            raise ForbiddenException("Only scheduled classes can be edited")
        if data.is_active is not None:
            raise ForbiddenException("Use the start or close actions to change class activity")

        next_course_id = data.course_id if data.course_id is not None else session.course_id
        next_venue_id = data.venue_id if data.venue_id is not None else session.venue_id
        next_start = data.session_start if data.session_start is not None else session.session_start
        next_end = data.session_end if data.session_end is not None else session.session_end

        if next_end <= next_start:
            raise ConflictException("Class end time must be after the start time")

        CourseService.assert_lecturer_assigned(db, session.lecturer_id, next_course_id)
        venue = VenueService.get_venue(db, next_venue_id)
        VenueService.require_geofence(venue)

        AttendanceSessionService._assert_no_schedule_conflict(
            db,
            lecturer_id=session.lecturer_id,
            venue_id=next_venue_id,
            session_start=next_start,
            session_end=next_end,
            exclude_session_id=session.session_id,
        )

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(session, field, value)
        db.flush()
        return session

    @staticmethod
    def close_session(db: Session, session_id: int, lecturer_id: int) -> AttendanceSession:
        """Close a session — sets is_active=False. Only the owning lecturer may close it."""
        session = AttendanceSessionService.get_session(db, session_id)
        if session.lecturer_id != lecturer_id:
            raise ForbiddenException("Only the session's lecturer can close it")
        session.is_active = False
        db.flush()
        logger.info("Session closed", extra={"session_id": session_id})
        return session

    @staticmethod
    def delete_session(db: Session, session_id: int, lecturer_id: int) -> None:
        """Delete a session. Only the owning lecturer may delete it, and only if it is not active."""
        session = AttendanceSessionService.get_session(db, session_id)
        if session.lecturer_id != lecturer_id:
            raise ForbiddenException("Only the session's lecturer can delete it")
        if session.is_active:
            raise ForbiddenException("Cannot delete an active session — close it first")
        db.delete(session)
        db.flush()
        logger.info("Session deleted", extra={"session_id": session_id})

