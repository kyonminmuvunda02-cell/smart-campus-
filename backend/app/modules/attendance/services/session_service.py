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
from app.modules.core.exceptions import NotFoundException, ForbiddenException

logger = logging.getLogger(__name__)


class AttendanceSessionService:

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
        qr_code = uuid.uuid4()
        qr_expiry = datetime.now(timezone.utc) + timedelta(
            seconds=settings.QR_CODE_TTL_SECONDS
        )

        session = AttendanceSession(
            course_id=data.course_id,
            lecturer_id=lecturer_id,
            venue_id=data.venue_id,
            session_start=data.session_start,
            session_end=data.session_end,
            semester=data.semester,
            academic_year=data.academic_year,
            qr_code=qr_code,
            qr_code_expiry=qr_expiry,
            is_active=True,
        )
        db.add(session)
        db.flush()
        logger.info("Attendance session created", extra={"session_id": session.session_id})
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
        """Update mutable session fields (session_end, is_active).

        Identity fields are immutable after creation.
        """
        session = AttendanceSessionService.get_session(db, session_id)
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
