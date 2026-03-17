import logging
from sqlalchemy.orm import Session
from sqlalchemy import select, func as sa_func

from app.modules.audit.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

# Canonical action constants — import these instead of writing strings inline
ACTION_LOGIN = "LOGIN"
ACTION_DIGITAL_ID_ISSUED = "DIGITAL_ID_ISSUED"
ACTION_DIGITAL_ID_REVOKED = "DIGITAL_ID_REVOKED"
ACTION_FRAUD_FLAG_SET = "FRAUD_FLAG_SET"
ACTION_USER_CREATED = "USER_CREATED"
ACTION_USER_DELETED = "USER_DELETED"


class AuditService:

    @staticmethod
    def log(
        db: Session,
        action: str,
        user_id: int | None = None,
        table_name: str | None = None,
        record_id: int | None = None,
        detail: str | None = None,
    ) -> AuditLog:
        """Write an immutable audit log entry.

        Call this from service methods for sensitive events.
        AuditLog rows are never updated or deleted.

        Args:
            db: Database session.
            action: Canonical action string (use module-level constants).
            user_id: The user who performed the action (None for system events).
            table_name: The table affected, if applicable.
            record_id: The PK of the affected row, if applicable.
            detail: Free-text detail (reason, context, etc.).

        Returns:
            The new AuditLog row — flushed, not committed.
        """
        entry = AuditLog(
            user_id=user_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
            detail=detail,
        )
        db.add(entry)
        db.flush()
        logger.info("Audit log written", extra={"action": action, "user_id": user_id})
        return entry

    @staticmethod
    def list_logs(
        db: Session,
        user_id: int | None = None,
        action: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        """Return paginated audit logs, optionally filtered by user_id and/or action."""
        query = select(AuditLog)
        count_query = select(sa_func.count()).select_from(AuditLog)

        if user_id is not None:
            query = query.where(AuditLog.user_id == user_id)
            count_query = count_query.where(AuditLog.user_id == user_id)
        if action is not None:
            query = query.where(AuditLog.action == action)
            count_query = count_query.where(AuditLog.action == action)

        total = db.execute(count_query).scalar_one()
        items = db.execute(
            query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}
