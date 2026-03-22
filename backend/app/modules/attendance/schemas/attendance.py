import re
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime


# ── AttendanceSession ──────────────────────────────────────────────────────────

class AttendanceSessionBase(BaseModel):
    course_id: int
    venue_id: int
    session_type: str = Field("Lecture", json_schema_extra={"example": "Lecture"})
    semester: str = Field(..., json_schema_extra={"example": "Semester 1"})
    academic_year: str = Field(..., json_schema_extra={"example": "2025/2026"})
    session_start: datetime
    session_end: datetime

    @field_validator("session_type")
    @classmethod
    def validate_session_type(cls, v: str) -> str:
        allowed = {"Lecture", "Tutorial", "Lab", "Seminar", "Exam", "Other"}
        if v not in allowed:
            raise ValueError(f"session_type must be one of: {allowed}")
        return v

    @field_validator("semester")
    @classmethod
    def validate_semester(cls, v: str) -> str:
        if v not in {"Semester 1", "Semester 2"}:
            raise ValueError("semester must be 'Semester 1' or 'Semester 2'")
        return v

    @field_validator("academic_year")
    @classmethod
    def validate_academic_year(cls, v: str) -> str:
        if not re.match(r"^\d{4}/\d{4}$", v):
            raise ValueError("academic_year must be in format YYYY/YYYY")
        first, second = int(v[:4]), int(v[5:])
        if second != first + 1:
            raise ValueError("academic_year years must be consecutive e.g. 2025/2026")
        return v


class AttendanceSessionCreate(AttendanceSessionBase):

    @field_validator("session_end")
    @classmethod
    def end_after_start(cls, v: datetime, info) -> datetime:
        start = info.data.get("session_start")
        if start and v <= start:
            raise ValueError("session_end must be after session_start")
        return v


class AttendanceSessionUpdate(BaseModel):
    course_id: int | None = None
    venue_id: int | None = None
    session_start: datetime | None = None
    session_end: datetime | None = None
    is_active: bool | None = None
    session_type: str | None = None
    semester: str | None = None
    academic_year: str | None = None

    @field_validator("session_type")
    @classmethod
    def validate_session_type(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"Lecture", "Tutorial", "Lab", "Seminar", "Exam", "Other"}
        if v not in allowed:
            raise ValueError(f"session_type must be one of: {allowed}")
        return v

    @field_validator("semester")
    @classmethod
    def validate_semester(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in {"Semester 1", "Semester 2"}:
            raise ValueError("semester must be 'Semester 1' or 'Semester 2'")
        return v

    @field_validator("academic_year")
    @classmethod
    def validate_academic_year(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r"^\d{4}/\d{4}$", v):
            raise ValueError("academic_year must be in format YYYY/YYYY")
        first, second = int(v[:4]), int(v[5:])
        if second != first + 1:
            raise ValueError("academic_year years must be consecutive e.g. 2025/2026")
        return v


class AttendanceSessionResponse(AttendanceSessionBase):
    model_config = ConfigDict(from_attributes=True)

    session_id: int
    lecturer_id: int
    qr_code: uuid.UUID
    qr_code_expiry: datetime
    is_active: bool
    created_at: datetime


class AttendanceSessionList(BaseModel):
    items: list[AttendanceSessionResponse]
    total: int
    skip: int
    limit: int


# ── QR refresh ─────────────────────────────────────────────────────────────────

class QRCodeResponse(BaseModel):
    """Returned when lecturer requests a fresh QR code for an existing session."""
    session_id: int
    qr_code: uuid.UUID
    qr_code_expiry: datetime
    qr_image_base64: str


# ── AttendanceRecord ───────────────────────────────────────────────────────────

class AttendanceCheckIn(BaseModel):
    """Payload the student's browser sends after scanning the QR code."""
    session_id: int
    qr_code: uuid.UUID
    device_id: str = Field(..., max_length=255, description="Browser or device fingerprint payload")
    gps_latitude: float = Field(..., ge=-90, le=90)
    gps_longitude: float = Field(..., ge=-180, le=180)
    # None is allowed — devices that can't report accuracy trigger fraud_flag
    gps_accuracy: float | None = Field(None, gt=0)


class AttendanceRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    attendance_id: int
    session_id: int
    student_id: int
    device_id: str
    gps_latitude: float | None
    gps_longitude: float | None
    gps_accuracy: float | None
    verification_status: str
    fraud_flag: bool
    checked_in_at: datetime
    reviewed_by: int | None = None
    reviewed_at: datetime | None = None
    review_note: str | None = None
    course_id: int | None = None
    course_label: str | None = None
    session_type: str | None = None
    session_start: datetime | None = None
    semester: str | None = None
    academic_year: str | None = None


class AttendanceRecordList(BaseModel):
    items: list[AttendanceRecordResponse]
    total: int
    skip: int
    limit: int


class AttendanceRecordReviewUpdate(BaseModel):
    verification_status: str = Field(..., json_schema_extra={"example": "Verified"})
    review_note: str | None = Field(None, max_length=255)

    @field_validator("verification_status")
    @classmethod
    def validate_review_status(cls, value: str) -> str:
        allowed = {"Verified", "Pending", "Rejected"}
        if value not in allowed:
            raise ValueError(f"verification_status must be one of: {allowed}")
        return value


class AttendanceReviewRecordResponse(AttendanceRecordResponse):
    course_id: int
    venue_id: int
    lecturer_id: int
    session_start: datetime
    session_end: datetime
    session_type: str


class AttendanceReviewRecordList(BaseModel):
    items: list[AttendanceReviewRecordResponse]
    total: int
    skip: int
    limit: int
