from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.core.database import get_db
from app.modules.auth.dependencies import require_role, get_current_user
from app.modules.enrollment.services.enrollment_service import EnrollmentService
from app.modules.enrollment.schemas.enrollment import (
    EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse, EnrollmentList,
)

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.post(
    "/",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    name="create_enrollment",
    operation_id="createEnrollment",
    dependencies=[Depends(require_role("Admin"))],
)
def create_enrollment(data: EnrollmentCreate, db: Session = Depends(get_db)):
    """Admin: enroll a student in a course."""
    enrollment = EnrollmentService.enroll_student(db, data)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get(
    "/students/{student_id}",
    response_model=EnrollmentList,
    name="list_student_enrollments",
    operation_id="listStudentEnrollments",
    dependencies=[Depends(require_role("Student", "Admin"))],
)
def list_student_enrollments(
    student_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all enrollments for a student. Students can only view their own."""
    if current_user["role"] == "Student" and current_user["user_id"] != student_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Students can only view their own enrollments")
    return EnrollmentService.list_enrollments_for_student(db, student_id, skip, limit)


@router.get(
    "/courses/{course_id}",
    response_model=EnrollmentList,
    name="list_course_enrollments",
    operation_id="listCourseEnrollments",
    dependencies=[Depends(require_role("Lecturer", "Admin"))],
)
def list_course_enrollments(
    course_id: int,
    semester: str,
    academic_year: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Lecturer/Admin: list all enrollments for a course in a given period."""
    return EnrollmentService.list_enrollments_for_course(
        db, course_id, semester, academic_year, skip, limit
    )


@router.patch(
    "/{student_id}/{course_id}",
    response_model=EnrollmentResponse,
    name="update_enrollment",
    operation_id="updateEnrollment",
    dependencies=[Depends(require_role("Admin"))],
)
def update_enrollment(
    student_id: int,
    course_id: int,
    semester: str,
    academic_year: str,
    data: EnrollmentUpdate,
    db: Session = Depends(get_db),
):
    """Admin: update enrollment status."""
    enrollment = EnrollmentService.update_enrollment(
        db, student_id, course_id, semester, academic_year, data
    )
    db.commit()
    db.refresh(enrollment)
    return enrollment
