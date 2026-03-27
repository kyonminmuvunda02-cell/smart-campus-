from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.core.database import get_db
from app.modules.auth.dependencies import require_role, get_current_user
from app.modules.attendance.services.session_service import AttendanceSessionService
from app.modules.attendance.services.qr_service import QRCodeService
from app.modules.attendance.schemas.attendance import (
    AttendanceSessionCreate, AttendanceSessionUpdate,
    AttendanceSessionResponse, AttendanceSessionList,
    QRCodeResponse,
)

router = APIRouter(prefix="/attendance/sessions", tags=["attendance-sessions"])


@router.post(
    "/",
    response_model=AttendanceSessionResponse,
    status_code=status.HTTP_201_CREATED,
    name="create_attendance_session",
    operation_id="createAttendanceSession",
)
def create_attendance_session(
    data: AttendanceSessionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("Lecturer")),
):
    """Lecturer: open a new attendance session and generate the first QR code."""
    session = AttendanceSessionService.create_session(db, data, current_user["user_id"])
    db.commit()
    db.refresh(session)
    return session


@router.get(
    "/",
    response_model=AttendanceSessionList,
    name="list_attendance_sessions",
    operation_id="listAttendanceSessions",
    dependencies=[Depends(require_role("Lecturer"))],
)
def list_attendance_sessions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lecturer: list only their own attendance sessions."""
    return AttendanceSessionService.list_sessions_for_lecturer(
        db, current_user["user_id"], skip, limit
    )


@router.get(
    "/{session_id}",
    response_model=AttendanceSessionResponse,
    name="get_attendance_session",
    operation_id="getAttendanceSession",
    dependencies=[Depends(require_role("Lecturer"))],
)
def get_attendance_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lecturer: get a single attendance session by ID."""
    session = AttendanceSessionService.get_session(db, session_id)
    if session.lecturer_id != current_user["user_id"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Lecturers can only view their own sessions")
    return session


@router.patch(
    "/{session_id}",
    response_model=AttendanceSessionResponse,
    name="update_attendance_session",
    operation_id="updateAttendanceSession",
    dependencies=[Depends(require_role("Lecturer"))],
)
def update_attendance_session(
    session_id: int,
    data: AttendanceSessionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lecturer: update mutable fields on their own attendance session."""
    session = AttendanceSessionService.get_session(db, session_id)
    if session.lecturer_id != current_user["user_id"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Lecturers can only update their own sessions")
    session = AttendanceSessionService.update_session(db, session_id, data)
    db.commit()
    db.refresh(session)
    return session


@router.post(
    "/{session_id}/start",
    response_model=QRCodeResponse,
    name="start_attendance_session",
    operation_id="startAttendanceSession",
)
def start_attendance_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("Lecturer")),
):
    """Lecturer: activate a scheduled session and issue its first live QR code."""
    session = AttendanceSessionService.start_session(db, session_id, current_user["user_id"])
    db.commit()
    db.refresh(session)
    qr_image = QRCodeService.generate_qr_image(
        session_id=session.session_id,
        qr_uuid=str(session.qr_code),
        expiry=session.qr_code_expiry,
    )
    return QRCodeResponse(
        session_id=session.session_id,
        qr_code=session.qr_code,
        qr_code_expiry=session.qr_code_expiry,
        qr_image_base64=qr_image,
    )


@router.post(
    "/{session_id}/close",
    response_model=AttendanceSessionResponse,
    name="close_attendance_session",
    operation_id="closeAttendanceSession",
)
def close_attendance_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("Lecturer")),
):
    """Lecturer: close their own session — sets is_active=False."""
    session = AttendanceSessionService.close_session(db, session_id, current_user["user_id"])
    db.commit()
    db.refresh(session)
    return session


@router.post(
    "/{session_id}/refresh-qr",
    response_model=QRCodeResponse,
    name="refresh_qr_code",
    operation_id="refreshQrCode",
)
def refresh_qr_code(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("Lecturer")),
):
    """Lecturer: generate a fresh QR code for an active session.

    Returns the new QR UUID, expiry, and a base64-encoded PNG image
    ready to embed directly in an <img> tag.
    """
    session = AttendanceSessionService.refresh_qr(db, session_id, current_user["user_id"])
    db.commit()
    db.refresh(session)
    qr_image = QRCodeService.generate_qr_image(
        session_id=session.session_id,
        qr_uuid=str(session.qr_code),
        expiry=session.qr_code_expiry,
    )
    return QRCodeResponse(
        session_id=session.session_id,
        qr_code=session.qr_code,
        qr_code_expiry=session.qr_code_expiry,
        qr_image_base64=qr_image,
    )


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="delete_attendance_session",
    operation_id="deleteAttendanceSession",
)
def delete_attendance_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("Lecturer")),
):
    """Lecturer: delete their own non-active session."""
    AttendanceSessionService.delete_session(db, session_id, current_user["user_id"])
    db.commit()

