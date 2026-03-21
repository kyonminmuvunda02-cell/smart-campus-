from datetime import datetime

from pydantic import BaseModel


class StudentAttendanceItem(BaseModel):
    attendance_id: int
    session_id: int
    session_type: str
    course_label: str
    checked_in_at: datetime
    verification_status: str
    fraud_flag: bool


class StudentEnrollmentItem(BaseModel):
    course_id: int
    course_label: str
    semester: str
    academic_year: str


class StudentDashboardSummary(BaseModel):
    records_count: int
    verified_count: int
    flagged_count: int
    active_enrollments: int
    digital_id_active: bool
    digital_id_expires_at: datetime | None = None
    recent_attendance: list[StudentAttendanceItem]
    enrollments: list[StudentEnrollmentItem]


class LecturerLiveSessionSummary(BaseModel):
    session_id: int
    session_type: str
    course_label: str
    venue_label: str
    session_start: datetime
    session_end: datetime
    live_records: int
    pending_reviews: int


class LecturerUpcomingSessionItem(BaseModel):
    session_id: int
    course_label: str
    session_start: datetime


class LecturerReviewItem(BaseModel):
    attendance_id: int
    student_name: str
    course_label: str
    gps_accuracy: float | None = None
    verification_status: str


class LecturerDashboardSummary(BaseModel):
    active_session_count: int
    current_verified_rate: int
    open_review_items: int
    live_session: LecturerLiveSessionSummary | None = None
    upcoming_sessions: list[LecturerUpcomingSessionItem]
    review_queue: list[LecturerReviewItem]


class AuditActivityItem(BaseModel):
    log_id: int
    action: str
    actor_name: str | None = None
    table_name: str | None = None
    record_id: int | None = None
    detail: str | None = None
    created_at: datetime


class AdminDashboardSummary(BaseModel):
    active_identities: int
    geofenced_venues: int
    total_venues: int
    open_exceptions: int
    live_sessions: int
    latest_audit: list[AuditActivityItem]


class DashboardSummaryResponse(BaseModel):
    role: str
    student: StudentDashboardSummary | None = None
    lecturer: LecturerDashboardSummary | None = None
    admin: AdminDashboardSummary | None = None
