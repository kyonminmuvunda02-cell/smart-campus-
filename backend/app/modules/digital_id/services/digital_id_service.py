import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func as sa_func

from app.modules.digital_id.models.digital_id import DigitalID
from app.modules.digital_id.schemas.digital_id import DigitalIDCreate
from app.modules.core.exceptions import NotFoundException, ConflictException, ForbiddenException

logger = logging.getLogger(__name__)


class DigitalIDService:

    @staticmethod
    def issue_digital_id(db: Session, data: DigitalIDCreate, issued_by: int) -> DigitalID:
        """Issue a new DigitalID for a student.

        Deactivates any existing active DigitalID first — a student should
        only ever hold one active card at a time.

        Args:
            db: Database session.
            data: DigitalID creation payload.
            issued_by: user_id of the admin issuing the card.

        Returns:
            The new DigitalID — flushed, not committed.
        """
        # Deactivate any existing active card for this student
        existing_active = db.execute(
            select(DigitalID).where(
                and_(
                    DigitalID.student_id == data.student_id,
                    DigitalID.is_active == True,
                )
            )
        ).scalars().first()
        if existing_active:
            existing_active.is_active = False
            existing_active.revoked_at = datetime.now(timezone.utc)
            existing_active.revoked_by = issued_by
            db.flush()

        # Check id_number uniqueness
        clash = db.execute(
            select(DigitalID).where(DigitalID.id_number == data.id_number)
        ).scalars().first()
        if clash:
            raise ConflictException(f"ID number '{data.id_number}' already exists")

        digital_id = DigitalID(
            student_id=data.student_id,
            id_number=data.id_number,
            is_active=True,
            expires_at=data.expires_at,
        )
        db.add(digital_id)
        db.flush()
        logger.info("DigitalID issued", extra={
            "digital_id_id": digital_id.digital_id_id,
            "student_id": data.student_id,
            "issued_by": issued_by,
        })
        return digital_id

    @staticmethod
    def revoke_digital_id(db: Session, digital_id_id: int, revoked_by: int) -> DigitalID:
        """Revoke (deactivate) a DigitalID. Raises 404 if not found, 409 if already revoked.

        Args:
            db: Database session.
            digital_id_id: PK of the DigitalID to revoke.
            revoked_by: user_id of the admin performing the revocation.

        Returns:
            The updated DigitalID — flushed, not committed.
        """
        digital_id = db.execute(
            select(DigitalID).where(DigitalID.digital_id_id == digital_id_id)
        ).scalars().first()
        if not digital_id:
            raise NotFoundException("DigitalID not found")
        if not digital_id.is_active:
            raise ConflictException("DigitalID is already revoked")

        digital_id.is_active = False
        digital_id.revoked_at = datetime.now(timezone.utc)
        digital_id.revoked_by = revoked_by
        db.flush()
        logger.info("DigitalID revoked", extra={
            "digital_id_id": digital_id_id,
            "revoked_by": revoked_by,
        })
        return digital_id

    @staticmethod
    def get_active_digital_id(db: Session, student_id: int) -> DigitalID:
        """Fetch the active DigitalID for a student. Raises 404 if none exists."""
        now = datetime.now(timezone.utc)
        digital_id = db.execute(
            select(DigitalID).where(
                and_(
                    DigitalID.student_id == student_id,
                    DigitalID.is_active == True,
                    DigitalID.expires_at > now,
                )
            )
        ).scalars().first()
        if not digital_id:
            raise NotFoundException("No active DigitalID found for this student")
        return digital_id

    @staticmethod
    def list_digital_ids(
        db: Session, student_id: int | None = None, skip: int = 0, limit: int = 20
    ) -> dict:
        """Return paginated DigitalIDs, optionally filtered by student."""
        query = select(DigitalID)
        count_query = select(sa_func.count()).select_from(DigitalID)
        if student_id is not None:
            query = query.where(DigitalID.student_id == student_id)
            count_query = count_query.where(DigitalID.student_id == student_id)

        total = db.execute(count_query).scalar_one()
        items = db.execute(
            query.order_by(DigitalID.issued_at.desc()).offset(skip).limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}
