import sys
import random
from pathlib import Path
from faker import Faker

# Add backend directory to sys.path so app modules can be imported
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

from app.modules.core.database import SessionLocal
from app.modules.users.models.user import AppUser          # noqa: F401
from app.modules.users.models.admin import Admin           # noqa: F401
from app.modules.users.models.student import Student       # noqa: F401
from app.modules.users.models.lecturer import Lecturer     # noqa: F401
from app.modules.venues.models.venue import Venue          # noqa: F401
from app.modules.courses.models.course import Course, CourseLecturer  # noqa: F401
from app.modules.enrollment.models.enrollment import Enrollment       # noqa: F401
from app.modules.digital_id.models.digital_id import DigitalID        # noqa: F401
from app.modules.attendance.models.session import AttendanceSession    # noqa: F401
from app.modules.attendance.models.record import AttendanceRecord      # noqa: F401
from app.modules.audit.models.audit_log import AuditLog               # noqa: F401
from app.modules.core.security import hash_password
from app.modules.core.config import settings

fake = Faker()

def generate_records():
    db = SessionLocal()
    try:
        # Check if already seeded to avoid duplicates
        if db.query(Student).count() > 0:
            print("Database already contains students. Skipping seed.")
            return

        print("Seeding database...")
        password_hash = hash_password("password123")
        
        # 1. Venues
        venues = []
        for i in range(1, 6):
            venue = Venue(
                venue_name=f"Room {fake.random_int(min=100, max=500)}",
                capacity=fake.random_element(elements=(30, 50, 100, 200)),
                building=fake.random_element(elements=("Main Block", "Science Wing", "Arts Center"))
            )
            db.add(venue)
            venues.append(venue)
        db.flush()
        print("✅ 5 Venues generated")

        # 2. Courses
        courses = []
        departments = ["Computer Science", "Engineering", "Business", "Mathematics"]
        for i in range(1, 11):
            course = Course(
                course_code=f"{fake.random_element(elements=('IT', 'CS', 'ENG', 'BUS'))}{fake.random_int(min=100, max=499)}",
                course_name=fake.catch_phrase().title(),
                credits=fake.random_element(elements=(3, 4, 6)),
                department=fake.random_element(elements=departments)
            )
            db.add(course)
            courses.append(course)
            
        # Add 5 more specific IT/CS courses
        cs_courses = [
            Course(course_code="CS310", course_name="Data Structures", credits=4, department="Computer Science"),
            Course(course_code="CS450", course_name="Artificial Intelligence", credits=4, department="Computer Science"),
            Course(course_code="IT201", course_name="Database Systems", credits=3, department="Computer Science"),
            Course(course_code="ENG305", course_name="Software Engineering", credits=4, department="Engineering"),
            Course(course_code="IT400", course_name="Final Year Project", credits=6, department="Computer Science")
        ]
        db.add_all(cs_courses)
        courses.extend(cs_courses)
        db.flush()
        print(f"✅ {len(courses)} Courses generated")

        # 3. Lecturers
        lecturers = []
        for i in range(1, 11):
            fn, ln = fake.first_name(), fake.last_name()
            email = f"{fn.lower()}.{ln.lower()}@smartcampus.com"
            user = AppUser(
                email=email,
                password_hash=password_hash,
                role="Lecturer",
                first_name=fn,
                last_name=ln
            )
            db.add(user)
            db.flush()
            
            lecturer = Lecturer(
                user_id=user.user_id,
                staff_number=f"STAFF-{fake.unique.random_int(min=1000, max=9999)}",
                department=fake.random_element(elements=departments),
                office_location=f"Office {fake.random_int(min=1, max=50)}"
            )
            db.add(lecturer)
            lecturers.append(lecturer)
        db.flush()
        print("✅ 10 Lecturers generated")

        # Assign Lecturers to Courses
        for course in courses:
            assigned_lecturer = fake.random_element(elements=lecturers)
            assignment = CourseLecturer(
                lecturer_id=assigned_lecturer.user_id,
                course_id=course.course_id,
                is_active=True
            )
            db.merge(assignment)
        db.flush()
        print("✅ Course Lecturer assignments generated")

        # 4. Students
        students = []
        for i in range(1, 101):
            fn, ln = fake.first_name(), fake.last_name()
            email = f"{fn.lower()}.{ln.lower()}@student.smartcampus.com"
            user = AppUser(
                email=email,
                password_hash=password_hash,
                role="Student",
                first_name=fn,
                last_name=ln
            )
            db.add(user)
            db.flush()
            
            student = Student(
                user_id=user.user_id,
                student_number=f"SIN-{fake.unique.random_int(min=100000, max=999999)}",
                program=fake.random_element(elements=("BSc Computer Science", "BSc IT", "BSc Engineering", "BBA")),
                year_of_study=fake.random_int(min=1, max=4)
            )
            db.add(student)
            students.append(student)
        db.flush()
        print("✅ 100 Students generated")

        # 5. Enrollments
        for student in students:
            # Enroll each student in 3 to 5 courses
            enrolled_courses = random.sample(courses, fake.random_int(min=3, max=5))
            for course in enrolled_courses:
                enrollment = Enrollment(
                    student_id=student.user_id,
                    course_id=course.course_id,
                    semester="Fall",
                    academic_year="2023-2024",
                    enrollment_status="Enrolled"
                )
                db.merge(enrollment)
        
        db.commit()
        print("✅ Enrollments generated")
        print("\n🎉 Seeding Complete! Enjoy your 100 students and other records")
        print("ℹ️  Password for all generated accounts is: password123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    generate_records()
