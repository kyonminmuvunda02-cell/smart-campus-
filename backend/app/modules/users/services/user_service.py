import logging
from sqlalchemy.orm import Session
from sqlalchemy import select, func as sa_func
from fastapi import HTTPException, status

from app.modules.users.models.user import AppUser
from app.modules.users.models.student import Student
from app.modules.users.models.lecturer import Lecturer
from app.modules.users.models.admin import Admin
from app.modules.users.schemas.user import (
    StudentCreate, LecturerCreate, AppUserUpdate,
    StudentUpdate, LecturerUpdate,
)
from app.modules.core.security import hash_password
from app.modules.core.exceptions import NotFoundException, ConflictException

logger = logging.getLogger(__name__)


class UserService:

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> AppUser:
        """Fetch a single AppUser by primary key. Raises 404 if not found."""
        user = db.execute(
            select(AppUser).where(AppUser.user_id == user_id)
        ).scalars().first()
        if not user:
            raise NotFoundException("User not found")
        return user

    @staticmethod
    def list_users(db: Session, skip: int = 0, limit: int = 20) -> dict:
        """Return a paginated list of all AppUsers."""
        total = db.execute(
            select(sa_func.count()).select_from(AppUser)
        ).scalar_one()
        items = db.execute(
            select(AppUser).order_by(AppUser.user_id).offset(skip).limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def _check_email_unique(db: Session, email: str) -> None:
        existing = db.execute(
            select(AppUser).where(AppUser.email == email)
        ).scalars().first()
        if existing:
            raise ConflictException("Email already registered")

    # ── Student creation ───────────────────────────────────────────────────────

    @staticmethod
    def create_student(db: Session, data: StudentCreate) -> AppUser:
        """Create an AppUser + Student profile in one transaction.

        Returns:
            The new AppUser — flushed, not committed.
        """
        UserService._check_email_unique(db, data.email)

        user = AppUser(
            email=data.email,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            role="Student",
        )
        db.add(user)
        db.flush()  # get user_id before creating profile

        profile = Student(
            user_id=user.user_id,
            student_number=data.student_number,
            program=data.program,
            year_of_study=data.year_of_study,
        )
        db.add(profile)
        db.flush()
        logger.info("Student created", extra={"user_id": user.user_id})
        return user

    # ── Lecturer creation ──────────────────────────────────────────────────────

    @staticmethod
    def create_lecturer(db: Session, data: LecturerCreate) -> AppUser:
        """Create an AppUser + Lecturer profile in one transaction.

        Returns:
            The new AppUser — flushed, not committed.
        """
        UserService._check_email_unique(db, data.email)

        user = AppUser(
            email=data.email,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            role="Lecturer",
        )
        db.add(user)
        db.flush()

        profile = Lecturer(
            user_id=user.user_id,
            staff_number=data.staff_number,
            department=data.department,
            office_location=data.office_location,
        )
        db.add(profile)
        db.flush()
        logger.info("Lecturer created", extra={"user_id": user.user_id})
        return user

    # ── Update ─────────────────────────────────────────────────────────────────

    @staticmethod
    def update_user(db: Session, user_id: int, data: AppUserUpdate) -> AppUser:
        """Update mutable AppUser fields. Raises 404 if user not found."""
        user = UserService.get_user_by_id(db, user_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        db.flush()
        return user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> None:
        """Soft-delete an AppUser. Raises 404 if not found."""
        user = UserService.get_user_by_id(db, user_id)
        user.is_deleted = True
        user.deleted_at = sa_func.now()
        db.flush()
        logger.info("User softly deleted", extra={"user_id": user_id})
