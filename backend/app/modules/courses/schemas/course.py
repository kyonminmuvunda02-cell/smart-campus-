from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


# ── Course ─────────────────────────────────────────────────────────────────────

class CourseBase(BaseModel):
    course_code: str = Field(..., json_schema_extra={"example": "CS301"})
    course_name: str = Field(..., json_schema_extra={"example": "Database Systems"})
    credits: int = Field(..., gt=0, json_schema_extra={"example": 3})
    department: str = Field(..., json_schema_extra={"example": "Computer Science"})


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    course_name: str | None = None
    credits: int | None = Field(None, gt=0)
    department: str | None = None


class CourseResponse(CourseBase):
    model_config = ConfigDict(from_attributes=True)
    course_id: int
    created_at: datetime


class CourseList(BaseModel):
    items: list[CourseResponse]
    total: int
    skip: int
    limit: int


# ── CourseLecturer ─────────────────────────────────────────────────────────────

class CourseLecturerCreate(BaseModel):
    lecturer_id: int
    course_id: int


class CourseLecturerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    lecturer_id: int
    course_id: int
    is_active: bool
    assigned_at: datetime


class CourseLecturerList(BaseModel):
    items: list[CourseLecturerResponse]
    total: int
