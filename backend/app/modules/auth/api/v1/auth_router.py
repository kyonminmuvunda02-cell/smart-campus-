import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.modules.auth.schemas.token import Token
from app.modules.core.database import get_db
from app.modules.core.security import verify_password, create_access_token
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models.user import AppUser
from app.modules.users.schemas.user import AppUserResponse

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post(
    "/login",
    response_model=Token,
    name="login_access_token",
    operation_id="loginAccessToken",
    openapi_extra={"security": []},
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate a user and return a JWT access token."""
    user = db.execute(
        select(AppUser).where(AppUser.email == form_data.username)
    ).scalars().first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=str(user.user_id), role=user.role)
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=AppUserResponse,
    name="get_current_user_profile",
    operation_id="getCurrentUser",
)
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return the currently authenticated user's full profile."""
    user = db.execute(
        select(AppUser).where(AppUser.user_id == current_user["user_id"])
    ).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
