import re
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime


class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int
    semester: str = Field(..., json_schema_extra={"example": "Semester 1"})
    academic_year: str = Field(..., json_schema_extra={"example": "2025/2026"})

    @field_validator("semester")
    @classmethod
    def validate_semester(cls, v: str) -> str:
        allowed = {"Semester 1", "Semester 2"}
        if v not in allowed:
            raise ValueError(f"semester must be one of: {allowed}")
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


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentUpdate(BaseModel):
    enrollment_status: str | None = None

    @field_validator("enrollment_status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {"Enrolled", "Dropped", "Completed"}
            if v not in allowed:
                raise ValueError(f"enrollment_status must be one of: {allowed}")
        return v


class EnrollmentResponse(EnrollmentBase):
    model_config = ConfigDict(from_attributes=True)
    enrollment_status: str
    created_at: datetime
    updated_at: datetime


class EnrollmentList(BaseModel):
    items: list[EnrollmentResponse]
    total: int
    skip: int
    limit: int
