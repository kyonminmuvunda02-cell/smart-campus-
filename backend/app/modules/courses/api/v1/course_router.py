from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.core.database import get_db
from app.modules.auth.dependencies import require_role, get_current_user
from app.modules.courses.services.course_service import CourseService
from app.modules.courses.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse, CourseList,
    CourseLecturerCreate, CourseLecturerResponse, CourseLecturerList,
)

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post(
    "/",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    name="create_course",
    operation_id="createCourse",
    dependencies=[Depends(require_role("Admin"))],
)
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    """Admin: create a new course."""
    course = CourseService.create_course(db, data)
    db.commit()
    db.refresh(course)
    return course


@router.get(
    "/",
    response_model=CourseList,
    name="list_courses",
    operation_id="listCourses",
    dependencies=[Depends(require_role("Student", "Lecturer", "Admin"))],
)
def list_courses(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all courses."""
    if current_user["role"] == "Lecturer":
        return CourseService.list_courses_for_lecturer(
            db, current_user["user_id"], skip, limit
        )
    return CourseService.list_courses(db, skip, limit)


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
    name="get_course",
    operation_id="getCourse",
    dependencies=[Depends(require_role("Student", "Lecturer", "Admin"))],
)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a single course by ID."""
    course = CourseService.get_course(db, course_id)
    if current_user["role"] == "Lecturer":
        CourseService.assert_lecturer_assigned(db, current_user["user_id"], course_id)
    return course


@router.patch(
    "/{course_id}",
    response_model=CourseResponse,
    name="update_course",
    operation_id="updateCourse",
    dependencies=[Depends(require_role("Admin"))],
)
def update_course(course_id: int, data: CourseUpdate, db: Session = Depends(get_db)):
    """Admin: update course details."""
    course = CourseService.update_course(db, course_id, data)
    db.commit()
    db.refresh(course)
    return course


@router.delete(
    "/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="delete_course",
    operation_id="deleteCourse",
    dependencies=[Depends(require_role("Admin"))],
)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """Admin: delete a course."""
    CourseService.delete_course(db, course_id)
    db.commit()


@router.post(
    "/assignments",
    response_model=CourseLecturerResponse,
    status_code=status.HTTP_201_CREATED,
    name="assign_lecturer_to_course",
    operation_id="assignLecturerToCourse",
    dependencies=[Depends(require_role("Admin"))],
)
def assign_lecturer(data: CourseLecturerCreate, db: Session = Depends(get_db)):
    """Admin: assign a lecturer to a course."""
    assignment = CourseService.assign_lecturer(db, data)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get(
    "/{course_id}/assignments",
    response_model=CourseLecturerList,
    name="list_course_assignments",
    operation_id="listCourseAssignments",
    dependencies=[Depends(require_role("Admin"))],
)
def list_course_assignments(course_id: int, db: Session = Depends(get_db)):
    """Admin: list active lecturer assignments for a course."""
    return CourseService.list_assignments_for_course(db, course_id)


@router.delete(
    "/assignments/{lecturer_id}/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="remove_lecturer_from_course",
    operation_id="removeLecturerFromCourse",
    dependencies=[Depends(require_role("Admin"))],
)
def remove_lecturer(lecturer_id: int, course_id: int, db: Session = Depends(get_db)):
    """Admin: deactivate a lecturer's course assignment."""
    CourseService.remove_lecturer(db, lecturer_id, course_id)
    db.commit()
