from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.core.database import get_db
from app.modules.auth.dependencies import require_role, get_current_user
from app.modules.digital_id.services.digital_id_service import DigitalIDService
from app.modules.digital_id.schemas.digital_id import (
    DigitalIDCreate, DigitalIDResponse, DigitalIDList, DigitalIDRevokeRequest,
)

router = APIRouter(prefix="/digital-ids", tags=["digital-ids"])


@router.post(
    "/",
    response_model=DigitalIDResponse,
    status_code=status.HTTP_201_CREATED,
    name="issue_digital_id",
    operation_id="issueDigitalId",
    dependencies=[Depends(require_role("Admin"))],
)
def issue_digital_id(
    data: DigitalIDCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("Admin")),
):
    """Admin: issue a new DigitalID card to a student."""
    digital_id = DigitalIDService.issue_digital_id(db, data, current_user["user_id"])
    db.commit()
    db.refresh(digital_id)
    return digital_id


@router.get(
    "/students/{student_id}/active",
    response_model=DigitalIDResponse,
    name="get_active_digital_id",
    operation_id="getActiveDigitalId",
    dependencies=[Depends(require_role("Student", "Lecturer", "Admin"))],
)
def get_active_digital_id(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get the active DigitalID for a student. Students can only view their own."""
    if current_user["role"] == "Student" and current_user["user_id"] != student_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Students can only view their own DigitalID")
    return DigitalIDService.get_active_digital_id(db, student_id)


@router.get(
    "/students/{student_id}",
    response_model=DigitalIDList,
    name="list_student_digital_ids",
    operation_id="listStudentDigitalIds",
    dependencies=[Depends(require_role("Admin"))],
)
def list_student_digital_ids(
    student_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Admin: list all DigitalIDs (including revoked) for a student."""
    return DigitalIDService.list_digital_ids(db, student_id=student_id, skip=skip, limit=limit)


@router.post(
    "/{digital_id_id}/revoke",
    response_model=DigitalIDResponse,
    name="revoke_digital_id",
    operation_id="revokeDigitalId",
    dependencies=[Depends(require_role("Admin"))],
)
def revoke_digital_id(
    digital_id_id: int,
    body: DigitalIDRevokeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("Admin")),
):
    """Admin: revoke a student's DigitalID."""
    digital_id = DigitalIDService.revoke_digital_id(db, digital_id_id, current_user["user_id"])
    db.commit()
    db.refresh(digital_id)
    return digital_id
