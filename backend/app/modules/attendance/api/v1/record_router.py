from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.core.database import get_db
from app.modules.auth.dependencies import require_role, get_current_user
from app.modules.attendance.services.checkin_service import CheckInService
from app.modules.attendance.schemas.attendance import (
    AttendanceCheckIn, AttendanceRecordResponse, AttendanceRecordList,
    AttendanceRecordReviewUpdate, AttendanceReviewRecordList,
)

router = APIRouter(prefix="/attendance/records", tags=["attendance-records"])


@router.post(
    "/checkin",
    response_model=AttendanceRecordResponse,
    status_code=status.HTTP_201_CREATED,
    name="student_checkin",
    operation_id="studentCheckin",
)
def student_checkin(
    data: AttendanceCheckIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("Student")),
):
    """Student: scan QR code and record attendance.

    Validates: active session → enrollment → valid DigitalID → no duplicate.
    Sets fraud_flag if GPS accuracy is unavailable.
    """
    record = CheckInService.process_checkin(db, data, current_user["user_id"])
    db.commit()
    db.refresh(record)
    return record


@router.get(
    "/sessions/{session_id}",
    response_model=AttendanceRecordList,
    name="list_session_records",
    operation_id="listSessionRecords",
    dependencies=[Depends(require_role("Lecturer", "Admin"))],
)
def list_session_records(
    session_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Lecturer/Admin: list all attendance records for a session."""
    return CheckInService.list_records_for_session(db, session_id, skip, limit)


@router.get(
    "/students/{student_id}",
    response_model=AttendanceRecordList,
    name="list_student_records",
    operation_id="listStudentRecords",
    dependencies=[Depends(require_role("Student", "Lecturer", "Admin"))],
)
def list_student_records(
    student_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List attendance records for a student. Students can only view their own."""
    if current_user["role"] == "Student" and current_user["user_id"] != student_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Students can only view their own records")
    return CheckInService.list_records_for_student(db, student_id, skip, limit)


@router.get(
    "/review-queue",
    response_model=AttendanceReviewRecordList,
    name="list_attendance_review_queue",
    operation_id="listAttendanceReviewQueue",
    dependencies=[Depends(require_role("Lecturer"))],
)
def list_attendance_review_queue(
    verification_status: str | None = None,
    session_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return CheckInService.list_review_queue(
        db,
        reviewer_role=current_user["role"],
        reviewer_user_id=current_user["user_id"],
        verification_status=verification_status,
        session_id=session_id,
        skip=skip,
        limit=limit,
    )


@router.patch(
    "/{attendance_id}/review",
    response_model=AttendanceRecordResponse,
    name="review_attendance_record",
    operation_id="reviewAttendanceRecord",
    dependencies=[Depends(require_role("Lecturer"))],
)
def review_attendance_record(
    attendance_id: int,
    data: AttendanceRecordReviewUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    record = CheckInService.review_record(
        db,
        attendance_id,
        data,
        reviewer_role=current_user["role"],
        reviewer_user_id=current_user["user_id"],
    )
    db.commit()
    db.refresh(record)
    return record
