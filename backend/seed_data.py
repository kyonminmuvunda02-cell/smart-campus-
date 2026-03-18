import random
import sys
import uuid
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

from faker import Faker

# Add backend directory to sys.path so app modules can be imported.
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.append(str(BACKEND_DIR))

from app.modules.attendance.models.record import AttendanceRecord
from app.modules.attendance.models.session import AttendanceSession
from app.modules.attendance.models.timetable import TimetableEntry
from app.modules.core.database import SessionLocal
from app.modules.core.security import hash_password
from app.modules.courses.models.course import Course, CourseLecturer
from app.modules.digital_id.models.digital_id import DigitalID
from app.modules.enrollment.models.enrollment import Enrollment
from app.modules.users.models.lecturer import Lecturer
from app.modules.users.models.student import Student
from app.modules.users.models.user import AppUser
from app.modules.venues.models.venue import Venue


fake = Faker()
CAMPUS_LATITUDE = -15.3875
CAMPUS_LONGITUDE = 28.3228
DEFAULT_PASSWORD = "password123"

TIMETABLE_SLOTS = [
    ("Monday", time(8, 0), time(10, 0)),
    ("Monday", time(10, 30), time(12, 30)),
    ("Monday", time(14, 0), time(16, 0)),
    ("Tuesday", time(8, 0), time(10, 0)),
    ("Tuesday", time(10, 30), time(12, 30)),
    ("Tuesday", time(14, 0), time(16, 0)),
    ("Wednesday", time(8, 0), time(10, 0)),
    ("Wednesday", time(10, 30), time(12, 30)),
    ("Wednesday", time(14, 0), time(16, 0)),
    ("Thursday", time(8, 0), time(10, 0)),
    ("Thursday", time(10, 30), time(12, 30)),
    ("Thursday", time(14, 0), time(16, 0)),
    ("Friday", time(8, 0), time(10, 0)),
    ("Friday", time(10, 30), time(12, 30)),
    ("Friday", time(14, 0), time(16, 0)),
]


def get_active_period(today: date) -> tuple[str, str, date, date]:
    if today.month >= 8:
        start_year = today.year
        semester = "Semester 1"
    elif today.month >= 1:
        start_year = today.year - 1
        semester = "Semester 2"
    else:
        start_year = today.year - 1
        semester = "Semester 1"

    academic_year = f"{start_year}/{start_year + 1}"
    academic_start = date(start_year, 8, 1)
    academic_end = date(start_year + 1, 7, 31)
    return semester, academic_year, academic_start, academic_end


def campus_offset(value: float, spread: float = 0.0035) -> float:
    return round(value + random.uniform(-spread, spread), 6)


def generate_records() -> None:
    db = SessionLocal()
    try:
        if db.query(Student).count() > 0:
            print("Database already contains students. Skipping seed.")
            return

        now = datetime.now(timezone.utc)
        semester, academic_year, academic_start, academic_end = get_active_period(now.date())
        password_hash = hash_password(DEFAULT_PASSWORD)
        departments = ["Computer Science", "Engineering", "Business", "Mathematics"]

        print("Seeding database...")
        print(f"Using academic period: {semester}, {academic_year}")

        # Fixed base entities used for demos and smoke tests.
        fixed_venue = Venue(
            venue_name="Main Auditorium",
            capacity=500,
            building="Administration Block",
            latitude=CAMPUS_LATITUDE,
            longitude=CAMPUS_LONGITUDE,
            radius_meters=90.0,
        )
        db.add(fixed_venue)

        fixed_course = Course(
            course_code="CS101",
            course_name="Introduction to Smart Systems",
            credits=4,
            department="Computer Science",
        )
        db.add(fixed_course)
        db.flush()

        lecturer_user = AppUser(
            email="lecturer@smartcampus.com",
            password_hash=password_hash,
            role="Lecturer",
            first_name="Fixed",
            last_name="Lecturer",
        )
        db.add(lecturer_user)
        db.flush()

        db.add(
            Lecturer(
                user_id=lecturer_user.user_id,
                staff_number="STAFF-0001",
                department="Computer Science",
                office_location="Room 101",
            )
        )
        db.add(
            CourseLecturer(
                lecturer_id=lecturer_user.user_id,
                course_id=fixed_course.course_id,
                is_active=True,
            )
        )

        student_user = AppUser(
            email="student@smartcampus.com",
            password_hash=password_hash,
            role="Student",
            first_name="Fixed",
            last_name="Student",
        )
        db.add(student_user)
        db.flush()

        db.add(
            Student(
                user_id=student_user.user_id,
                student_number="SIN-000001",
                program="BSc Computer Science",
                year_of_study=1,
            )
        )
        db.add(
            Enrollment(
                student_id=student_user.user_id,
                course_id=fixed_course.course_id,
                semester=semester,
                academic_year=academic_year,
                enrollment_status="Enrolled",
            )
        )
        db.add(
            DigitalID(
                student_id=student_user.user_id,
                id_number="DID-000001",
                is_active=True,
                issued_at=now,
                expires_at=now + timedelta(days=365 * 4),
            )
        )
        db.flush()

        print("Added fixed test lecturer and student accounts.")

        venues = [fixed_venue]
        venue_blueprints = [
            ("Innovation Hub", "Technology Wing", 120, 75.0),
            ("Engineering Lab 2", "Engineering Block", 60, 45.0),
            ("Data Science Studio", "Science Wing", 80, 55.0),
            ("Business Seminar Room", "Commerce Block", 90, 65.0),
            ("North Lecture Theatre", "North Campus", 180, 85.0),
        ]
        for name, building, capacity, radius in venue_blueprints:
            venue = Venue(
                venue_name=name,
                building=building,
                capacity=capacity,
                latitude=campus_offset(CAMPUS_LATITUDE),
                longitude=campus_offset(CAMPUS_LONGITUDE),
                radius_meters=radius,
            )
            db.add(venue)
            venues.append(venue)
        db.flush()
        print(f"Added {len(venues)} geofenced venues.")

        courses = [fixed_course]
        random_courses = [
            Course(
                course_code=f"{fake.random_element(elements=('IT', 'CS', 'ENG', 'BUS'))}{fake.random_int(min=100, max=499)}",
                course_name=fake.catch_phrase().title(),
                credits=fake.random_element(elements=(3, 4, 6)),
                department=fake.random_element(elements=departments),
            )
            for _ in range(10)
        ]
        named_courses = [
            Course(course_code="CS310", course_name="Data Structures", credits=4, department="Computer Science"),
            Course(course_code="CS450", course_name="Artificial Intelligence", credits=4, department="Computer Science"),
            Course(course_code="IT201", course_name="Database Systems", credits=3, department="Computer Science"),
            Course(course_code="ENG305", course_name="Software Engineering", credits=4, department="Engineering"),
            Course(course_code="IT400", course_name="Final Year Project", credits=6, department="Computer Science"),
        ]
        db.add_all(random_courses + named_courses)
        courses.extend(random_courses)
        courses.extend(named_courses)
        db.flush()
        print(f"Added {len(courses)} courses.")

        lecturer_users = [lecturer_user]
        for _ in range(10):
            first_name = fake.first_name()
            last_name = fake.last_name()
            user = AppUser(
                email=f"{first_name.lower()}.{last_name.lower()}@smartcampus.com",
                password_hash=password_hash,
                role="Lecturer",
                first_name=first_name,
                last_name=last_name,
            )
            db.add(user)
            db.flush()

            db.add(
                Lecturer(
                    user_id=user.user_id,
                    staff_number=f"STAFF-{fake.unique.random_int(min=1000, max=9999)}",
                    department=fake.random_element(elements=departments),
                    office_location=f"Office {fake.random_int(min=1, max=50)}",
                )
            )
            lecturer_users.append(user)
        db.flush()
        print(f"Added {len(lecturer_users)} lecturers.")

        course_to_lecturer: dict[int, int] = {fixed_course.course_id: lecturer_user.user_id}
        for course in courses:
            if course.course_id == fixed_course.course_id:
                continue
            assigned_lecturer = random.choice(lecturer_users)
            course_to_lecturer[course.course_id] = assigned_lecturer.user_id
            db.add(
                CourseLecturer(
                    lecturer_id=assigned_lecturer.user_id,
                    course_id=course.course_id,
                    is_active=True,
                )
            )
        db.flush()
        print("Assigned lecturers to every course.")

        student_users = [student_user]
        for _ in range(100):
            first_name = fake.first_name()
            last_name = fake.last_name()
            user = AppUser(
                email=f"{first_name.lower()}.{last_name.lower()}@student.smartcampus.com",
                password_hash=password_hash,
                role="Student",
                first_name=first_name,
                last_name=last_name,
            )
            db.add(user)
            db.flush()

            db.add(
                Student(
                    user_id=user.user_id,
                    student_number=f"SIN-{fake.unique.random_int(min=100000, max=999999)}",
                    program=fake.random_element(
                        elements=("BSc Computer Science", "BSc IT", "BSc Engineering", "BBA")
                    ),
                    year_of_study=fake.random_int(min=1, max=4),
                )
            )
            db.add(
                DigitalID(
                    student_id=user.user_id,
                    id_number=f"DID-{fake.unique.random_int(min=100000, max=999999)}",
                    is_active=True,
                    issued_at=now - timedelta(days=random.randint(30, 180)),
                    expires_at=now + timedelta(days=random.randint(365, 1500)),
                )
            )
            student_users.append(user)
        db.flush()
        print(f"Added {len(student_users)} students with active digital IDs.")

        enrollments: list[Enrollment] = []
        for user in student_users:
            if user.user_id == student_user.user_id:
                extra_course = random.choice([course for course in courses if course.course_id != fixed_course.course_id])
                enrollments.append(
                    Enrollment(
                        student_id=user.user_id,
                        course_id=extra_course.course_id,
                        semester=semester,
                        academic_year=academic_year,
                        enrollment_status="Enrolled",
                    )
                )
                continue

            for course in random.sample(courses, random.randint(3, 5)):
                enrollments.append(
                    Enrollment(
                        student_id=user.user_id,
                        course_id=course.course_id,
                        semester=semester,
                        academic_year=academic_year,
                        enrollment_status="Enrolled",
                    )
                )

        db.add_all(enrollments)
        db.flush()
        print(f"Added {len(enrollments)} enrollments.")

        timetable_entries: list[TimetableEntry] = []
        for index, course in enumerate(courses[: len(TIMETABLE_SLOTS)]):
            weekday, start_time, end_time = TIMETABLE_SLOTS[index]
            timetable_entries.append(
                TimetableEntry(
                    course_id=course.course_id,
                    lecturer_id=course_to_lecturer[course.course_id],
                    venue_id=venues[index % len(venues)].venue_id,
                    weekday=weekday,
                    start_time=start_time,
                    end_time=end_time,
                    session_type=random.choice(["Lecture", "Tutorial", "Lab", "Seminar"]),
                    semester=semester,
                    academic_year=academic_year,
                    effective_start_date=academic_start,
                    effective_end_date=min(academic_end, now.date() + timedelta(days=120)),
                    is_active=True,
                )
            )
        db.add_all(timetable_entries)
        db.flush()
        print(f"Added {len(timetable_entries)} recurring timetable entries.")

        live_session = AttendanceSession(
            course_id=fixed_course.course_id,
            lecturer_id=lecturer_user.user_id,
            venue_id=fixed_venue.venue_id,
            session_type="Lecture",
            timetable_slot="Today 09:00-11:00",
            session_start=now - timedelta(minutes=20),
            session_end=now + timedelta(minutes=70),
            semester=semester,
            academic_year=academic_year,
            qr_code=uuid.uuid4(),
            qr_code_expiry=now + timedelta(seconds=45),
            is_active=True,
        )
        next_session = AttendanceSession(
            course_id=fixed_course.course_id,
            lecturer_id=lecturer_user.user_id,
            venue_id=fixed_venue.venue_id,
            session_type="Tutorial",
            timetable_slot="Tomorrow 10:30-12:30",
            session_start=now + timedelta(days=1),
            session_end=now + timedelta(days=1, hours=2),
            semester=semester,
            academic_year=academic_year,
            qr_code=uuid.uuid4(),
            qr_code_expiry=now + timedelta(days=1),
            is_active=False,
        )
        db.add_all([live_session, next_session])
        db.flush()

        eligible_students = [
            enrollment.student_id
            for enrollment in enrollments
            if enrollment.course_id == fixed_course.course_id
            and enrollment.semester == semester
            and enrollment.academic_year == academic_year
        ]
        sample_students = eligible_students[:6]
        review_statuses = [
            ("Verified", False, 14.0, None, None, None),
            ("Verified", False, 11.5, None, None, None),
            ("Pending", True, 42.0, lecturer_user.user_id, now - timedelta(minutes=2), "Low-confidence GPS fix."),
            ("Rejected", True, 95.0, lecturer_user.user_id, now - timedelta(minutes=1), "Submitted well outside the venue radius."),
        ]
        attendance_records: list[AttendanceRecord] = []
        for index, student_id in enumerate(sample_students):
            status, fraud_flag, gps_accuracy, reviewed_by, reviewed_at, review_note = review_statuses[min(index, len(review_statuses) - 1)]
            attendance_records.append(
                AttendanceRecord(
                    session_id=live_session.session_id,
                    student_id=student_id,
                    device_id=f"device-{student_id}",
                    gps_latitude=CAMPUS_LATITUDE + random.uniform(-0.0002, 0.0002),
                    gps_longitude=CAMPUS_LONGITUDE + random.uniform(-0.0002, 0.0002),
                    gps_accuracy=gps_accuracy,
                    verification_status=status,
                    fraud_flag=fraud_flag,
                    reviewed_by=reviewed_by,
                    reviewed_at=reviewed_at,
                    review_note=review_note,
                    checked_in_at=now - timedelta(minutes=max(1, 10 - index)),
                )
            )
        db.add_all(attendance_records)
        db.commit()

        print("Added demo sessions and sample attendance evidence.")
        print("Seeding complete.")
        print("Fixed Lecturer: lecturer@smartcampus.com / password123")
        print("Fixed Student: student@smartcampus.com / password123")
        print("Password for all generated accounts: password123")
    except Exception as error:
        db.rollback()
        print(f"Error seeding database: {error}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    generate_records()
