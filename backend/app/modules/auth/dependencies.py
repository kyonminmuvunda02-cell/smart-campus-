from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.modules.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Decode and validate the JWT. Raises 401 if invalid or expired.

    Returns a lightweight dict with user_id and role — no DB query needed
    because role is embedded in the token at login time.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        role: str | None = payload.get("role")

        if not user_id or not role or payload.get("type") != "access":
            raise credentials_exception

    except (JWTError, ValueError):
        raise credentials_exception

    return {"user_id": int(user_id), "role": role}


def require_role(*allowed_roles: str):
    """Dependency factory — restricts an endpoint to specific user roles.

    Usage:
        @router.post("/", dependencies=[Depends(require_role("Lecturer", "Admin"))])
    """
    def checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted to: {list(allowed_roles)}",
            )
        return current_user
    return checker
