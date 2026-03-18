from datetime import datetime, timedelta
import uuid

from sqlalchemy import func as sa_func, or_, select
from sqlalchemy.orm import Session

from app.modules.attendance.models.session import AttendanceSession
from app.modules.attendance.models.timetable import TimetableEntry
from app.modules.attendance.schemas.timetable import TimetableEntryCreate
from app.modules.courses.services.course_service import CourseService
from app.modules.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.modules.venues.services.venue_service import VenueService


WEEKDAY_TO_INDEX = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6,
}


class TimetableService:
    @staticmethod
    def get_entry(db: Session, timetable_id: int) -> TimetableEntry:
        entry = db.execute(
            select(TimetableEntry).where(TimetableEntry.timetable_id == timetable_id)
        ).scalars().first()
        if not entry:
            raise NotFoundException("Timetable entry not found")
        return entry

    @staticmethod
    def _assert_schedule_allowed(
        db: Session,
        course_id: int,
        lecturer_id: int,
        venue_id: int,
    ) -> None:
        CourseService.assert_lecturer_assigned(db, lecturer_id, course_id)
        venue = VenueService.get_venue(db, venue_id)
        VenueService.require_geofence(venue)

    @staticmethod
    def _assert_no_overlap(
        db: Session,
        *,
        weekday: str,
        start_time,
        end_time,
        lecturer_id: int,
        venue_id: int,
        ignore_timetable_id: int | None = None,
    ) -> None:
        overlap_filters = [
            TimetableEntry.is_active == True,
            TimetableEntry.weekday == weekday,
            TimetableEntry.start_time < end_time,
            TimetableEntry.end_time > start_time,
            or_(
                TimetableEntry.lecturer_id == lecturer_id,
                TimetableEntry.venue_id == venue_id,
            ),
        ]
        if ignore_timetable_id is not None:
            overlap_filters.append(TimetableEntry.timetable_id != ignore_timetable_id)
        overlapping = db.execute(
            select(TimetableEntry).where(*overlap_filters)
        ).scalars().first()
        if overlapping:
            raise ConflictException("This timetable slot overlaps with an existing lecturer or venue booking")

    @staticmethod
    def create_entry(db: Session, data: TimetableEntryCreate) -> TimetableEntry:
        TimetableService._assert_schedule_allowed(db, data.course_id, data.lecturer_id, data.venue_id)
        TimetableService._assert_no_overlap(
            db,
            weekday=data.weekday,
            start_time=data.start_time,
            end_time=data.end_time,
            lecturer_id=data.lecturer_id,
            venue_id=data.venue_id,
        )
        entry = TimetableEntry(**data.model_dump(), is_active=True)
        db.add(entry)
        db.flush()
        return entry

    @staticmethod
    def update_entry(db: Session, timetable_id: int, data) -> TimetableEntry:
        entry = TimetableService.get_entry(db, timetable_id)
        updates = data.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(entry, field, value)

        TimetableService._assert_schedule_allowed(db, entry.course_id, entry.lecturer_id, entry.venue_id)
        TimetableService._assert_no_overlap(
            db,
            weekday=entry.weekday,
            start_time=entry.start_time,
            end_time=entry.end_time,
            lecturer_id=entry.lecturer_id,
            venue_id=entry.venue_id,
            ignore_timetable_id=timetable_id,
        )
        db.flush()
        return entry

    @staticmethod
    def delete_entry(db: Session, timetable_id: int) -> None:
        entry = TimetableService.get_entry(db, timetable_id)
        entry.is_deleted = True
        entry.is_active = False
        entry.deleted_at = sa_func.now()
        db.flush()

    @staticmethod
    def list_entries(
        db: Session,
        *,
        lecturer_id: int | None = None,
        course_id: int | None = None,
        semester: str | None = None,
        academic_year: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        filters = []
        if lecturer_id is not None:
            filters.append(TimetableEntry.lecturer_id == lecturer_id)
        if course_id is not None:
            filters.append(TimetableEntry.course_id == course_id)
        if semester is not None:
            filters.append(TimetableEntry.semester == semester)
        if academic_year is not None:
            filters.append(TimetableEntry.academic_year == academic_year)

        count_query = select(sa_func.count()).select_from(TimetableEntry)
        query = select(TimetableEntry)
        if filters:
            count_query = count_query.where(*filters)
            query = query.where(*filters)

        total = db.execute(count_query).scalar_one()
        items = db.execute(
            query
            .order_by(TimetableEntry.weekday, TimetableEntry.start_time, TimetableEntry.timetable_id)
            .offset(skip)
            .limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def generate_sessions(
        db: Session,
        *,
        start_date,
        end_date,
        lecturer_scope: int | None = None,
    ) -> dict:
        filters = [TimetableEntry.is_active == True]
        if lecturer_scope is not None:
            filters.append(TimetableEntry.lecturer_id == lecturer_scope)

        entries = db.execute(select(TimetableEntry).where(*filters)).scalars().all()
        created_session_ids: list[int] = []
        skipped_dates: list[str] = []

        for entry in entries:
            current = start_date
            weekday_index = WEEKDAY_TO_INDEX[entry.weekday]
            while current <= end_date:
                if current.weekday() != weekday_index:
                    current += timedelta(days=1)
                    continue
                if entry.effective_start_date and current < entry.effective_start_date:
                    current += timedelta(days=1)
                    continue
                if entry.effective_end_date and current > entry.effective_end_date:
                    current += timedelta(days=1)
                    continue

                session_start = datetime.combine(current, entry.start_time)
                session_end = datetime.combine(current, entry.end_time)

                existing = db.execute(
                    select(AttendanceSession).where(
                        AttendanceSession.course_id == entry.course_id,
                        AttendanceSession.lecturer_id == entry.lecturer_id,
                        AttendanceSession.venue_id == entry.venue_id,
                        AttendanceSession.session_start == session_start,
                        AttendanceSession.session_end == session_end,
                    )
                ).scalars().first()
                if existing:
                    skipped_dates.append(f"{entry.timetable_id}:{current.isoformat()}")
                    current += timedelta(days=1)
                    continue

                session = AttendanceSession(
                    course_id=entry.course_id,
                    lecturer_id=entry.lecturer_id,
                    venue_id=entry.venue_id,
                    session_type=entry.session_type,
                    timetable_slot=f"{entry.weekday} {entry.start_time.strftime('%H:%M')}-{entry.end_time.strftime('%H:%M')}",
                    session_start=session_start,
                    session_end=session_end,
                    semester=entry.semester,
                    academic_year=entry.academic_year,
                    qr_code=uuid.uuid4(),  # placeholder until the live attendance window starts
                    qr_code_expiry=session_start,
                    is_active=False,
                )
                db.add(session)
                db.flush()
                created_session_ids.append(session.session_id)
                current += timedelta(days=1)

        return {
            "created_session_ids": created_session_ids,
            "skipped_dates": skipped_dates,
        }
