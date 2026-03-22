from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.modules.attendance.schemas.attendance import AttendanceSessionUpdate
from app.modules.attendance.services.session_service import AttendanceSessionService
from app.modules.core.exceptions import ConflictException, ForbiddenException


def test_start_session_activates_and_sets_qr_expiry(monkeypatch):
    now = datetime.now(timezone.utc)
    session = SimpleNamespace(
        session_id=44,
        lecturer_id=7,
        session_end=now + timedelta(hours=1),
        is_active=False,
        qr_code=None,
        qr_code_expiry=None,
        venue=SimpleNamespace(),
    )

    monkeypatch.setattr(AttendanceSessionService, "get_session", staticmethod(lambda _db, _id: session))
    require_geofence_calls = []

    class VenueServiceStub:
        @staticmethod
        def require_geofence(venue):
            require_geofence_calls.append(venue)

    import app.modules.venues.services.venue_service as venue_service_module

    monkeypatch.setattr(venue_service_module, "VenueService", VenueServiceStub)

    class FakeDB:
        def __init__(self):
            self.flushed = False

        def flush(self):
            self.flushed = True

    db = FakeDB()

    result = AttendanceSessionService.start_session(db, session_id=44, lecturer_id=7)

    assert result.is_active is True
    assert result.qr_code is not None
    assert result.qr_code_expiry > now
    assert db.flushed is True
    assert require_geofence_calls == [session.venue]


def test_start_session_rejects_past_end_time(monkeypatch):
    now = datetime.now(timezone.utc)
    session = SimpleNamespace(
        session_id=45,
        lecturer_id=7,
        session_end=now - timedelta(minutes=1),
        is_active=False,
        venue=SimpleNamespace(),
    )
    monkeypatch.setattr(AttendanceSessionService, "get_session", staticmethod(lambda _db, _id: session))

    with pytest.raises(ForbiddenException):
        AttendanceSessionService.start_session(SimpleNamespace(), session_id=45, lecturer_id=7)


def test_update_session_applies_fields_and_checks_for_conflicts(monkeypatch):
    now = datetime.now(timezone.utc)
    session = SimpleNamespace(
        session_id=9,
        lecturer_id=4,
        course_id=8,
        venue_id=3,
        session_start=now + timedelta(hours=1),
        session_end=now + timedelta(hours=2),
        session_type="Lecture",
        is_active=False,
    )
    monkeypatch.setattr(AttendanceSessionService, "get_session", staticmethod(lambda _db, _id: session))

    conflict_args = {}

    def fake_conflict_check(_db, **kwargs):
        conflict_args.update(kwargs)

    monkeypatch.setattr(
        AttendanceSessionService,
        "_assert_no_schedule_conflict",
        staticmethod(fake_conflict_check),
    )

    class CourseServiceStub:
        @staticmethod
        def assert_lecturer_assigned(_db, _lecturer_id, _course_id):
            return None

    class VenueServiceStub:
        @staticmethod
        def get_venue(_db, venue_id):
            return SimpleNamespace(venue_id=venue_id)

        @staticmethod
        def require_geofence(_venue):
            return None

    import app.modules.courses.services.course_service as course_service_module
    import app.modules.venues.services.venue_service as venue_service_module

    monkeypatch.setattr(course_service_module, "CourseService", CourseServiceStub)
    monkeypatch.setattr(venue_service_module, "VenueService", VenueServiceStub)

    class FakeDB:
        def __init__(self):
            self.flushed = False

        def flush(self):
            self.flushed = True

    update = AttendanceSessionUpdate(
        session_end=now + timedelta(hours=2),
        session_type="Lab",
    )
    db = FakeDB()

    result = AttendanceSessionService.update_session(db, session_id=9, data=update)

    assert conflict_args == {
        "lecturer_id": 4,
        "venue_id": 3,
        "session_start": now + timedelta(hours=1),
        "session_end": now + timedelta(hours=2),
        "exclude_session_id": 9,
    }
    assert result.session_end == now + timedelta(hours=2)
    assert result.session_type == "Lab"
    assert result.is_active is False
    assert db.flushed is True


def test_conflict_helper_blocks_overlapping_lecturer_session():
    existing = SimpleNamespace(session_id=1)

    class FakeResult:
        def __init__(self, value):
            self._value = value

        def scalars(self):
            return self

        def first(self):
            return self._value

    class FakeDB:
        def __init__(self):
            self.calls = 0

        def execute(self, _query):
            self.calls += 1
            return FakeResult(existing if self.calls == 1 else None)

    db = FakeDB()
    now = datetime.now(timezone.utc)

    with pytest.raises(ConflictException):
        AttendanceSessionService._assert_no_schedule_conflict(
            db,
            lecturer_id=4,
            venue_id=3,
            session_start=now,
            session_end=now + timedelta(hours=1),
        )
