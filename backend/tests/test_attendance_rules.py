from types import SimpleNamespace

import pytest

from app.modules.attendance.schemas.attendance import AttendanceCheckIn, AttendanceSessionCreate
from app.modules.attendance.services.checkin_service import CheckInService
from app.modules.core.exceptions import ConflictException, ForbiddenException
from app.modules.venues.schemas.venue import VenueCreate


def make_checkin(**overrides):
    payload = {
        "session_id": 1,
        "qr_code": "123e4567-e89b-12d3-a456-426614174000",
        "device_id": "device-1",
        "gps_latitude": -15.385,
        "gps_longitude": 28.322,
        "gps_accuracy": 12,
    }
    payload.update(overrides)
    return AttendanceCheckIn.model_validate(payload)


def make_session(venue):
    return SimpleNamespace(venue=venue)


def test_venue_create_requires_complete_geofence():
    with pytest.raises(ValueError):
        VenueCreate(
            venue_name="LT-1",
            building="Main Block",
            capacity=120,
            latitude=-15.385,
        )


def test_session_create_accepts_timetable_metadata():
    payload = AttendanceSessionCreate.model_validate(
        {
            "course_id": 10,
            "venue_id": 2,
            "session_type": "Lecture",
            "timetable_slot": "Mon 08:00-10:00",
            "semester": "Semester 1",
            "academic_year": "2026/2027",
            "session_start": "2026-03-18T08:00:00+02:00",
            "session_end": "2026-03-18T10:00:00+02:00",
        }
    )

    assert payload.session_type == "Lecture"
    assert payload.timetable_slot == "Mon 08:00-10:00"


def test_validate_geofence_allows_student_inside_radius():
    venue = SimpleNamespace(latitude=-15.385, longitude=28.322, radius_meters=40)
    distance = CheckInService.validate_geofence(make_session(venue), make_checkin())

    assert distance < 1


def test_validate_geofence_rejects_student_outside_radius():
    venue = SimpleNamespace(latitude=-15.385, longitude=28.322, radius_meters=20)

    with pytest.raises(ForbiddenException):
        CheckInService.validate_geofence(
            make_session(venue),
            make_checkin(gps_latitude=-15.380, gps_longitude=28.330, gps_accuracy=5),
        )


def test_validate_geofence_rejects_missing_venue_configuration():
    venue = SimpleNamespace(latitude=None, longitude=28.322, radius_meters=45)

    with pytest.raises(ConflictException):
        CheckInService.validate_geofence(make_session(venue), make_checkin())
