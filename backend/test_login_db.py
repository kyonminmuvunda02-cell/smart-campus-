import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.modules.core.database import SessionLocal
from app.modules.users.models.user import AppUser
from app.modules.users.models.student import Student
from app.modules.users.models.lecturer import Lecturer
from app.modules.users.models.admin import Admin
from app.modules.venues.models.venue import Venue          # noqa: F401
from app.modules.courses.models.course import Course, CourseLecturer  # noqa: F401
from app.modules.enrollment.models.enrollment import Enrollment       # noqa: F401
from app.modules.digital_id.models.digital_id import DigitalID        # noqa: F401
from app.modules.attendance.models.session import AttendanceSession    # noqa: F401
from app.modules.attendance.models.record import AttendanceRecord      # noqa: F401
from app.modules.audit.models.audit_log import AuditLog               # noqa: F401
from app.modules.core.security import verify_password
from sqlalchemy import select

def check():
    db = SessionLocal()
    try:
        user = db.execute(select(AppUser).where(AppUser.email == "admin@smartcampus.com")).scalars().first()
        if not user:
            print("No user admin@smartcampus.com found")
            return
            
        print(f"Found user: {user.email}, role: {user.role}")
        print(f"Password 'adminpassword123' check: {verify_password('adminpassword123', user.password_hash)}")
    except Exception as e:
        print(f"Error checking DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check()
