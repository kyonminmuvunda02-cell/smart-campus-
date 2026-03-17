from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.core.database import get_db
from app.modules.auth.dependencies import require_role
from app.modules.users.services.user_service import UserService
from app.modules.users.schemas.user import (
    StudentCreate, LecturerCreate, AppUserResponse,
    AppUserList, AppUserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "/students",
    response_model=AppUserResponse,
    status_code=status.HTTP_201_CREATED,
    name="create_student",
    operation_id="createStudent",
    dependencies=[Depends(require_role("Admin"))],
)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    """Admin: create a new Student account with profile."""
    user = UserService.create_student(db, data)
    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/lecturers",
    response_model=AppUserResponse,
    status_code=status.HTTP_201_CREATED,
    name="create_lecturer",
    operation_id="createLecturer",
    dependencies=[Depends(require_role("Admin"))],
)
def create_lecturer(data: LecturerCreate, db: Session = Depends(get_db)):
    """Admin: create a new Lecturer account with profile."""
    user = UserService.create_lecturer(db, data)
    db.commit()
    db.refresh(user)
    return user


@router.get(
    "/",
    response_model=AppUserList,
    name="list_users",
    operation_id="listUsers",
    dependencies=[Depends(require_role("Admin"))],
)
def list_users(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Admin: list all users with pagination."""
    return UserService.list_users(db, skip, limit)


@router.get(
    "/{user_id}",
    response_model=AppUserResponse,
    name="get_user",
    operation_id="getUser",
    dependencies=[Depends(require_role("Admin"))],
)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Admin: get a single user by ID."""
    return UserService.get_user_by_id(db, user_id)


@router.patch(
    "/{user_id}",
    response_model=AppUserResponse,
    name="update_user",
    operation_id="updateUser",
    dependencies=[Depends(require_role("Admin"))],
)
def update_user(user_id: int, data: AppUserUpdate, db: Session = Depends(get_db)):
    """Admin: update a user's basic fields."""
    user = UserService.update_user(db, user_id, data)
    db.commit()
    db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="delete_user",
    operation_id="deleteUser",
    dependencies=[Depends(require_role("Admin"))],
)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Admin: permanently delete a user account."""
    UserService.delete_user(db, user_id)
    db.commit()
