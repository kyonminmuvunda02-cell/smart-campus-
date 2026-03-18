from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.attendance.schemas.timetable import (
    TimetableEntryCreate,
    TimetableEntryList,
    TimetableEntryResponse,
    TimetableEntryUpdate,
    TimetableGenerationRequest,
    TimetableGenerationResponse,
)
from app.modules.attendance.services.timetable_service import TimetableService
from app.modules.auth.dependencies import get_current_user, require_role
from app.modules.core.database import get_db

router = APIRouter(prefix="/attendance/timetable", tags=["attendance-sessions"])


@router.get(
    "/",
    response_model=TimetableEntryList,
    operation_id="listTimetableEntries",
    name="list_timetable_entries",
    dependencies=[Depends(require_role("Lecturer", "Admin"))],
)
def list_timetable_entries(
    course_id: int | None = None,
    semester: str | None = None,
    academic_year: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    lecturer_id = current_user["user_id"] if current_user["role"] == "Lecturer" else None
    return TimetableService.list_entries(
        db,
        lecturer_id=lecturer_id,
        course_id=course_id,
        semester=semester,
        academic_year=academic_year,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/",
    response_model=TimetableEntryResponse,
    operation_id="createTimetableEntry",
    name="create_timetable_entry",
    dependencies=[Depends(require_role("Admin"))],
)
def create_timetable_entry(
    data: TimetableEntryCreate,
    db: Session = Depends(get_db),
):
    entry = TimetableService.create_entry(db, data)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch(
    "/{timetable_id}",
    response_model=TimetableEntryResponse,
    operation_id="updateTimetableEntry",
    name="update_timetable_entry",
    dependencies=[Depends(require_role("Admin"))],
)
def update_timetable_entry(
    timetable_id: int,
    data: TimetableEntryUpdate,
    db: Session = Depends(get_db),
):
    entry = TimetableService.update_entry(db, timetable_id, data)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete(
    "/{timetable_id}",
    operation_id="deleteTimetableEntry",
    name="delete_timetable_entry",
    dependencies=[Depends(require_role("Admin"))],
)
def delete_timetable_entry(
    timetable_id: int,
    db: Session = Depends(get_db),
):
    TimetableService.delete_entry(db, timetable_id)
    db.commit()
    return {"message": "Timetable entry archived"}


@router.post(
    "/generate-sessions",
    response_model=TimetableGenerationResponse,
    operation_id="generateTimetableSessions",
    name="generate_timetable_sessions",
    dependencies=[Depends(require_role("Lecturer", "Admin"))],
)
def generate_timetable_sessions(
    data: TimetableGenerationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    lecturer_scope = current_user["user_id"] if current_user["role"] == "Lecturer" else None
    result = TimetableService.generate_sessions(
        db,
        start_date=data.start_date,
        end_date=data.end_date,
        lecturer_scope=lecturer_scope,
    )
    db.commit()
    return result
