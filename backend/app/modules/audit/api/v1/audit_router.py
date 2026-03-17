from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.core.database import get_db
from app.modules.auth.dependencies import require_role
from app.modules.audit.services.audit_service import AuditService
from app.modules.audit.schemas.audit_log import AuditLogList

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get(
    "/logs",
    response_model=AuditLogList,
    name="list_audit_logs",
    operation_id="listAuditLogs",
    dependencies=[Depends(require_role("Admin"))],
)
def list_audit_logs(
    user_id: int | None = None,
    action: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Admin: query immutable audit log entries, optionally filtered by user or action."""
    return AuditService.list_logs(db, user_id=user_id, action=action, skip=skip, limit=limit)
