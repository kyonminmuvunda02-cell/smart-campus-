from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.modules.reporting.services.dashboard_service import DashboardReportingService


class FakeScalarResult:
    def __init__(self, value):
        self._value = value

    def first(self):
        return self._value


class FakeExecuteResult:
    def __init__(self, value):
        self._value = value

    def all(self):
        return self._value

    def scalars(self):
        return FakeScalarResult(self._value)


class FakeDB:
    def __init__(self, *, execute_values=None, scalar_values=None):
        self._execute_values = list(execute_values or [])
        self._scalar_values = list(scalar_values or [])

    def execute(self, _query):
        return FakeExecuteResult(self._execute_values.pop(0))

    def scalar(self, _query):
        return self._scalar_values.pop(0)


def test_student_dashboard_summary_includes_enrollments_and_digital_id():
    now = datetime.now(timezone.utc)
    db = FakeDB(
        execute_values=[
            [
                (
                    SimpleNamespace(
                        attendance_id=11,
                        session_id=7,
                        checked_in_at=now,
                        verification_status="Verified",
                        fraud_flag=False,
                    ),
                    SimpleNamespace(session_type="Lecture"),
                    SimpleNamespace(course_code="CSC101", course_name="Intro to Computing"),
                )
            ],
            [
                (
                    SimpleNamespace(
                        course_id=4,
                        semester="Semester 1",
                        academic_year="2026/2027",
                        created_at=now,
                    ),
                    SimpleNamespace(course_code="CSC101", course_name="Intro to Computing"),
                )
            ],
            SimpleNamespace(expires_at=now + timedelta(days=30)),
        ],
        scalar_values=[8, 6, 2, 3],
    )

    summary = DashboardReportingService._student_summary(db, user_id=99)

    assert summary.records_count == 8
    assert summary.verified_count == 6
    assert summary.flagged_count == 2
    assert summary.active_enrollments == 3
    assert summary.digital_id_active is True
    assert summary.recent_attendance[0].course_label == "CSC101 - Intro to Computing"
    assert summary.enrollments[0].academic_year == "2026/2027"


def test_lecturer_dashboard_summary_calculates_live_and_upcoming_state():
    now = datetime.now(timezone.utc)
    live_session = SimpleNamespace(
        session_id=21,
        is_active=True,
        session_type="Lecture",
        session_start=now - timedelta(minutes=20),
        session_end=now + timedelta(minutes=40),
    )
    upcoming_session = SimpleNamespace(
        session_id=22,
        is_active=False,
        session_type="Tutorial",
        session_start=now + timedelta(days=1),
        session_end=now + timedelta(days=1, hours=2),
    )
    db = FakeDB(
        execute_values=[
            [
                (
                    live_session,
                    SimpleNamespace(course_code="CSC301", course_name="Software Engineering"),
                    SimpleNamespace(venue_name="Lab 2"),
                ),
                (
                    upcoming_session,
                    SimpleNamespace(course_code="CSC302", course_name="Project Management"),
                    SimpleNamespace(venue_name="LT-1"),
                ),
            ],
            [
                (
                    SimpleNamespace(
                        attendance_id=501,
                        gps_accuracy=18.5,
                        verification_status="Pending",
                        checked_in_at=now,
                    ),
                    live_session,
                    SimpleNamespace(course_code="CSC301", course_name="Software Engineering"),
                    SimpleNamespace(first_name="Ada", last_name="Lovelace", email="ada@example.com"),
                )
            ],
        ],
        scalar_values=[10, 2, 1, 1],
    )

    summary = DashboardReportingService._lecturer_summary(db, user_id=12)

    assert summary.active_session_count == 1
    assert summary.current_verified_rate == 80
    assert summary.open_review_items == 1
    assert summary.live_session is not None
    assert summary.live_session.live_records == 10
    assert summary.live_session.pending_reviews == 2
    assert summary.live_session.course_label == "CSC301 - Software Engineering"
    assert summary.upcoming_sessions[0].course_label == "CSC302 - Project Management"
    assert summary.review_queue[0].student_name == "Ada Lovelace"


def test_admin_dashboard_summary_returns_audit_actor_names():
    now = datetime.now(timezone.utc)
    db = FakeDB(
        execute_values=[
            [
                (
                    SimpleNamespace(
                        log_id=14,
                        action="update",
                        table_name="attendancerecord",
                        record_id=44,
                        detail="Marked as verified",
                        created_at=now,
                    ),
                    SimpleNamespace(first_name="Grace", last_name="Hopper", email="grace@example.com"),
                )
            ]
        ],
        scalar_values=[120, 8, 10, 4, 2],
    )

    summary = DashboardReportingService._admin_summary(db)

    assert summary.active_identities == 120
    assert summary.geofenced_venues == 8
    assert summary.total_venues == 10
    assert summary.open_exceptions == 4
    assert summary.live_sessions == 2
    assert summary.latest_audit[0].actor_name == "Grace Hopper"
    assert summary.latest_audit[0].detail == "Marked as verified"
