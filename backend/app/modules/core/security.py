import bcrypt
from datetime import datetime, timezone, timedelta
from jose import jwt
from app.modules.core.config import settings


def verify_password(plain: str, hashed: str) -> bool:
    """Compare a plain-text password against its bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt before storing it."""
    # Salt is included in the returned hash string
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(subject: str, role: str) -> str:
    """Create a signed JWT access token embedding the user's ID and role.

    Args:
        subject: The user's user_id as a string — stored in the 'sub' claim.
        role: 'Student', 'Lecturer', or 'Admin'.

    Returns:
        Signed JWT string.
    """
    expire = datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
