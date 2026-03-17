from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.core.database import Base
from datetime import datetime


class AppUser(Base):
    __tablename__ = "appuser"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # Constrained to: 'Student' | 'Lecturer' | 'Admin'
    role: Mapped[str] = mapped_column(String(20), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    # String references prevent circular imports across modules
    student_profile: Mapped["Student"] = relationship(back_populates="user", uselist=False)
    lecturer_profile: Mapped["Lecturer"] = relationship(back_populates="user", uselist=False)
    admin_profile: Mapped["Admin"] = relationship(back_populates="user", uselist=False)
