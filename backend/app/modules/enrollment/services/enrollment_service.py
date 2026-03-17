import logging
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func as sa_func

from app.modules.enrollment.models.enrollment import Enrollment
from app.modules.enrollment.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate
from app.modules.core.exceptions import NotFoundException, ConflictException

logger = logging.getLogger(__name__)


class EnrollmentService:

    @staticmethod
    def enroll_student(db: Session, data: EnrollmentCreate) -> Enrollment:
        """Enroll a student in a course for a given semester/year.

        Raises 409 if the student is already enrolled in this exact combination.
        """
        existing = db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == data.student_id,
                    Enrollment.course_id == data.course_id,
                    Enrollment.semester == data.semester,
                    Enrollment.academic_year == data.academic_year,
                )
            )
        ).scalars().first()
        if existing:
            raise ConflictException("Student already enrolled in this course for this period")

        enrollment = Enrollment(**data.model_dump(), enrollment_status="Enrolled")
        db.add(enrollment)
        db.flush()
        logger.info("Student enrolled", extra={
            "student_id": data.student_id,
            "course_id": data.course_id,
        })
        return enrollment

    @staticmethod
    def get_enrollment(
        db: Session,
        student_id: int,
        course_id: int,
        semester: str,
        academic_year: str,
    ) -> Enrollment:
        """Fetch a specific enrollment by its composite key. Raises 404 if not found."""
        enrollment = db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.course_id == course_id,
                    Enrollment.semester == semester,
                    Enrollment.academic_year == academic_year,
                )
            )
        ).scalars().first()
        if not enrollment:
            raise NotFoundException("Enrollment not found")
        return enrollment

    @staticmethod
    def list_enrollments_for_student(
        db: Session, student_id: int, skip: int = 0, limit: int = 20
    ) -> dict:
        """Return paginated enrollments for a specific student."""
        total = db.execute(
            select(sa_func.count()).select_from(Enrollment).where(
                Enrollment.student_id == student_id
            )
        ).scalar_one()
        items = db.execute(
            select(Enrollment)
            .where(Enrollment.student_id == student_id)
            .order_by(Enrollment.academic_year.desc(), Enrollment.semester)
            .offset(skip)
            .limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def list_enrollments_for_course(
        db: Session, course_id: int, semester: str, academic_year: str,
        skip: int = 0, limit: int = 20
    ) -> dict:
        """Return paginated enrollments for a specific course/semester/year."""
        total = db.execute(
            select(sa_func.count()).select_from(Enrollment).where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.semester == semester,
                    Enrollment.academic_year == academic_year,
                )
            )
        ).scalar_one()
        items = db.execute(
            select(Enrollment)
            .where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.semester == semester,
                    Enrollment.academic_year == academic_year,
                )
            )
            .offset(skip)
            .limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def update_enrollment(
        db: Session,
        student_id: int,
        course_id: int,
        semester: str,
        academic_year: str,
        data: EnrollmentUpdate,
    ) -> Enrollment:
        """Update enrollment status (Enrolled → Dropped / Completed)."""
        enrollment = EnrollmentService.get_enrollment(
            db, student_id, course_id, semester, academic_year
        )
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(enrollment, field, value)
        db.flush()
        return enrollment
