import re
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


WEEKDAYS = {
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
}

SESSION_TYPES = {"Lecture", "Tutorial", "Lab", "Seminar", "Exam", "Other"}


class TimetableEntryBase(BaseModel):
    course_id: int
    lecturer_id: int
    venue_id: int
    weekday: str = Field(..., json_schema_extra={"example": "Monday"})
    start_time: time
    end_time: time
    session_type: str = Field("Lecture", json_schema_extra={"example": "Lecture"})
    semester: str = Field(..., json_schema_extra={"example": "Semester 1"})
    academic_year: str = Field(..., json_schema_extra={"example": "2025/2026"})
    effective_start_date: date | None = None
    effective_end_date: date | None = None

    @field_validator("weekday")
    @classmethod
    def validate_weekday(cls, value: str) -> str:
        if value not in WEEKDAYS:
            raise ValueError(f"weekday must be one of: {sorted(WEEKDAYS)}")
        return value

    @field_validator("session_type")
    @classmethod
    def validate_session_type(cls, value: str) -> str:
        if value not in SESSION_TYPES:
            raise ValueError(f"session_type must be one of: {sorted(SESSION_TYPES)}")
        return value

    @field_validator("semester")
    @classmethod
    def validate_semester(cls, value: str) -> str:
        if value not in {"Semester 1", "Semester 2"}:
            raise ValueError("semester must be 'Semester 1' or 'Semester 2'")
        return value

    @field_validator("academic_year")
    @classmethod
    def validate_academic_year(cls, value: str) -> str:
        if not re.match(r"^\d{4}/\d{4}$", value):
            raise ValueError("academic_year must be in format YYYY/YYYY")
        first, second = int(value[:4]), int(value[5:])
        if second != first + 1:
            raise ValueError("academic_year years must be consecutive e.g. 2025/2026")
        return value

    @model_validator(mode="after")
    def validate_date_range(self) -> "TimetableEntryBase":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        if (
            self.effective_start_date is not None
            and self.effective_end_date is not None
            and self.effective_end_date < self.effective_start_date
        ):
            raise ValueError("effective_end_date must be on or after effective_start_date")
        return self


class TimetableEntryCreate(TimetableEntryBase):
    pass


class TimetableEntryUpdate(BaseModel):
    course_id: int | None = None
    lecturer_id: int | None = None
    venue_id: int | None = None
    weekday: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    session_type: str | None = None
    semester: str | None = None
    academic_year: str | None = None
    effective_start_date: date | None = None
    effective_end_date: date | None = None
    is_active: bool | None = None

    @field_validator("weekday")
    @classmethod
    def validate_weekday(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in WEEKDAYS:
            raise ValueError(f"weekday must be one of: {sorted(WEEKDAYS)}")
        return value

    @field_validator("session_type")
    @classmethod
    def validate_session_type(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in SESSION_TYPES:
            raise ValueError(f"session_type must be one of: {sorted(SESSION_TYPES)}")
        return value


class TimetableEntryResponse(TimetableEntryBase):
    model_config = ConfigDict(from_attributes=True)

    timetable_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TimetableEntryList(BaseModel):
    items: list[TimetableEntryResponse]
    total: int
    skip: int
    limit: int


class TimetableGenerationRequest(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_range(self) -> "TimetableGenerationRequest":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class TimetableGenerationResponse(BaseModel):
    created_session_ids: list[int]
    skipped_dates: list[str]
