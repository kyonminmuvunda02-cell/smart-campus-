import logging
from sqlalchemy.orm import Session
from sqlalchemy import select, func as sa_func

from app.modules.courses.models.course import Course, CourseLecturer
from app.modules.courses.schemas.course import CourseCreate, CourseUpdate, CourseLecturerCreate
from app.modules.core.exceptions import NotFoundException, ConflictException

logger = logging.getLogger(__name__)


class CourseService:

    @staticmethod
    def create_course(db: Session, data: CourseCreate) -> Course:
        """Create a new course. Raises 409 if course_code already exists."""
        existing = db.execute(
            select(Course).where(Course.course_code == data.course_code)
        ).scalars().first()
        if existing:
            raise ConflictException(f"Course code '{data.course_code}' already exists")

        course = Course(**data.model_dump())
        db.add(course)
        db.flush()
        logger.info("Course created", extra={"course_id": course.course_id})
        return course

    @staticmethod
    def get_course(db: Session, course_id: int) -> Course:
        """Fetch a course by ID. Raises 404 if not found."""
        course = db.execute(
            select(Course).where(Course.course_id == course_id)
        ).scalars().first()
        if not course:
            raise NotFoundException("Course not found")
        return course

    @staticmethod
    def list_courses(db: Session, skip: int = 0, limit: int = 20) -> dict:
        """Return paginated list of courses."""
        total = db.execute(select(sa_func.count()).select_from(Course)).scalar_one()
        items = db.execute(
            select(Course).order_by(Course.course_code).offset(skip).limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def update_course(db: Session, course_id: int, data: CourseUpdate) -> Course:
        """Update mutable course fields."""
        course = CourseService.get_course(db, course_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(course, field, value)
        db.flush()
        return course

    @staticmethod
    def delete_course(db: Session, course_id: int) -> None:
        """Soft-delete a course. Raises 404 if not found."""
        course = CourseService.get_course(db, course_id)
        course.is_deleted = True
        course.deleted_at = sa_func.now()
        db.flush()
        logger.info("Course softly deleted", extra={"course_id": course_id})

    @staticmethod
    def assign_lecturer(db: Session, data: CourseLecturerCreate) -> CourseLecturer:
        """Assign a lecturer to a course. Raises 409 if already assigned."""
        existing = db.execute(
            select(CourseLecturer).where(
                CourseLecturer.lecturer_id == data.lecturer_id,
                CourseLecturer.course_id == data.course_id,
            )
        ).scalars().first()
        if existing:
            if existing.is_active:
                raise ConflictException("Lecturer already assigned to this course")
            # Re-activate if previously deactivated
            existing.is_active = True
            db.flush()
            return existing

        assignment = CourseLecturer(
            lecturer_id=data.lecturer_id,
            course_id=data.course_id,
            is_active=True,
        )
        db.add(assignment)
        db.flush()
        logger.info("Lecturer assigned to course", extra={
            "lecturer_id": data.lecturer_id,
            "course_id": data.course_id,
        })
        return assignment

    @staticmethod
    def remove_lecturer(db: Session, lecturer_id: int, course_id: int) -> None:
        """Deactivate a lecturer's assignment to a course."""
        assignment = db.execute(
            select(CourseLecturer).where(
                CourseLecturer.lecturer_id == lecturer_id,
                CourseLecturer.course_id == course_id,
            )
        ).scalars().first()
        if not assignment:
            raise NotFoundException("Assignment not found")
        assignment.is_active = False
        db.flush()
