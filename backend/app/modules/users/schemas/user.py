from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
from datetime import datetime


# ── AppUser ────────────────────────────────────────────────────────────────────

class AppUserBase(BaseModel):
    email: str = Field(..., json_schema_extra={"example": "student@cavendish.ac.zm"})
    first_name: str = Field(..., json_schema_extra={"example": "Chanda"})
    last_name: str = Field(..., json_schema_extra={"example": "Mwale"})
    role: str = Field(..., json_schema_extra={"example": "Student"})

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"Student", "Lecturer", "Admin"}
        if v not in allowed:
            raise ValueError(f"role must be one of: {allowed}")
        return v


class AppUserCreate(AppUserBase):
    password: str = Field(..., min_length=8, json_schema_extra={"example": "SecurePass123"})


class AppUserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None


class AppUserResponse(AppUserBase):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    created_at: datetime
    updated_at: datetime
    # password_hash is never returned — excluded at the model level
    password_hash: str = Field(exclude=True, default="")


class AppUserList(BaseModel):
    items: list[AppUserResponse]
    total: int
    skip: int
    limit: int


# ── Student ────────────────────────────────────────────────────────────────────

class StudentProfileBase(BaseModel):
    student_number: str = Field(..., json_schema_extra={"example": "CUZ/2024/001"})
    program: str = Field(..., json_schema_extra={"example": "BSc Computer Science"})
    year_of_study: int = Field(..., ge=1, le=6)


class StudentCreate(AppUserCreate, StudentProfileBase):
    """Create a Student — AppUser fields + student profile fields."""
    pass


class StudentProfileResponse(StudentProfileBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    created_at: datetime


class StudentUpdate(BaseModel):
    program: str | None = None
    year_of_study: int | None = Field(None, ge=1, le=6)


# ── Lecturer ───────────────────────────────────────────────────────────────────

class LecturerProfileBase(BaseModel):
    staff_number: str = Field(..., json_schema_extra={"example": "CUZ/STAFF/042"})
    department: str = Field(..., json_schema_extra={"example": "Computer Science"})
    office_location: str | None = Field(None, json_schema_extra={"example": "Block B, Room 12"})


class LecturerCreate(AppUserCreate, LecturerProfileBase):
    """Create a Lecturer — AppUser fields + lecturer profile fields."""
    pass


class LecturerProfileResponse(LecturerProfileBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    created_at: datetime


class LecturerUpdate(BaseModel):
    department: str | None = None
    office_location: str | None = None
