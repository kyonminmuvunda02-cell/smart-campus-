import sys
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

from app.modules.core.database import SessionLocal
from app.modules.users.models.user import AppUser          # noqa: F401
from app.modules.users.models.student import Student       # noqa: F401
from app.modules.users.models.lecturer import Lecturer     # noqa: F401
from app.modules.users.models.admin import Admin           # noqa: F401
from app.modules.venues.models.venue import Venue          # noqa: F401
from app.modules.courses.models.course import Course, CourseLecturer  # noqa: F401
from app.modules.enrollment.models.enrollment import Enrollment       # noqa: F401
from app.modules.digital_id.models.digital_id import DigitalID        # noqa: F401
from app.modules.attendance.models.session import AttendanceSession    # noqa: F401
from app.modules.attendance.models.record import AttendanceRecord      # noqa: F401
from app.modules.audit.models.audit_log import AuditLog               # noqa: F401
from app.modules.core.security import hash_password
from app.modules.core.config import settings

def seed_admin():
    db = SessionLocal()
    try:
        email = "admin@smartcampus.com"
        password = "adminpassword123"
        
        # Check if admin already exists
        existing_admin = db.query(AppUser).filter(AppUser.email == email).first()
        if existing_admin:
            print(f"Admin already exists. Login with: {email} / {password}")
            return
        
        # Create AppUser
        user = AppUser(
            email=email,
            password_hash=hash_password(password),
            role="Admin",
            first_name="System",
            last_name="Admin"
        )
        db.add(user)
        db.flush() # flush to get user_id
        
        # Create Admin profile
        admin_profile = Admin(
            user_id=user.user_id,
            admin_level=1
        )
        db.add(admin_profile)
        
        db.commit()
        print(f"Admin created successfully! Login with: {email} / {password}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
