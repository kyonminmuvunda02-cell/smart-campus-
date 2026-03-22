# Smart Campus Backend

Backend API for the CUZ Smart Campus project.

This backend is built with FastAPI and PostgreSQL. It handles:

- login and JWT authentication
- users, courses, venues, and enrollments
- digital IDs
- class creation and attendance check-in
- review queue and reporting

This guide is written for a beginner student. Follow the steps in order.

---

## 1. What This Backend Does

In simple terms, this backend supports this flow:

1. Admin creates the academic setup.
2. Lecturer logs in and creates a class for a course.
3. Lecturer opens check-in for that class.
4. Student scans the QR code and submits attendance.
5. The system checks:
   - is the class active?
   - is the student enrolled in that course?
   - does the student have a valid digital ID?
   - is the student inside the venue geofence?
6. The attendance record is saved.

---

## 2. What You Need Before You Start

Install these first:

- Python 3.11 or newer
- PostgreSQL 14 or newer
- Git
- A code editor such as VS Code

### Check that Python works

Open PowerShell and run:

```powershell
python --version
pip --version
```

If Python does not work:

- reinstall Python
- during installation, tick `Add Python to PATH`

### Check that PostgreSQL works

Open PowerShell and run:

```powershell
psql --version
```

If `psql` is not found, PostgreSQL may not be added to PATH. You can still continue, but you may need to use pgAdmin to create the database instead of the command line.

---

## 3. Project Folder

This guide assumes your project looks like this:

```text
smartcampus/
|-- main.py
|-- backend/
`-- frontend/
```

All commands in this README are run inside the `backend` folder unless stated otherwise.
If you are standing in the project root, `python main.py` also starts the backend.

Move into the backend folder:

```powershell
cd d:\projects\smartcampus\backend
```

---

## 4. Create a Virtual Environment

A virtual environment keeps this project's Python packages separate from other projects.

### Create it

```powershell
python -m venv .venv
```

### Activate it

```powershell
.\.venv\Scripts\activate
```

After activation, your terminal should show something like `(venv)`.

---

## 5. Install Backend Packages

With the virtual environment activated, run:

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

This installs FastAPI, SQLAlchemy, Alembic, psycopg, and other backend dependencies.

---

## 6. Create the `.env` File

Copy the example file:

```powershell
Copy-Item .env.example .env
```

Then open `.env` and edit it.

Use values like this:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=smartcampus

SECRET_KEY=replace-this-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=8
QR_CODE_TTL_SECONDS=600
ATTENDANCE_SELF_CHECKIN_WINDOW_MINUTES=30
GPS_MAX_TRUSTED_ACCURACY_METERS=75.0
CORS_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development
```

### Important notes

- `POSTGRES_PASSWORD` must match your PostgreSQL password.
- `SECRET_KEY` must be long and random.
- `QR_CODE_TTL_SECONDS=600` means the lecturer QR stays valid for 10 minutes.
- `ATTENDANCE_SELF_CHECKIN_WINDOW_MINUTES=30` means students can self-check in during the first 30 minutes, after which late attendance should go to review logic.

### Generate a random secret key

Run:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the result into `SECRET_KEY`.

---

## 7. Create the Database

You need a PostgreSQL database called `smartcampus`.

### Option A: using `psql`

```powershell
psql -U postgres -c "CREATE DATABASE smartcampus;"
```

If PostgreSQL asks for a password, enter your PostgreSQL password.

### Option B: using pgAdmin

If `psql` is not working:

1. Open pgAdmin.
2. Connect to your local PostgreSQL server.
3. Right-click `Databases`.
4. Click `Create` -> `Database...`
5. Name it `smartcampus`.
6. Save.

---

## 8. Run Database Migrations

Migrations create the tables used by the backend.

Run:

```powershell
alembic upgrade head
```

If this succeeds, your database schema is ready.

---

## 9. Start the Backend Server

From the `backend` folder, use:

```powershell
python main.py
```

From the project root, this also works:

```powershell
python main.py
```

You do not need to type `uvicorn` manually. `python main.py` starts the FastAPI app for you.

When the server is running, open:

- API docs: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`
- Health check: `http://localhost:8000/health`

---

## 10. First Run Check

After starting the server:

1. Open `http://localhost:8000/health`
2. Confirm you get a JSON response
3. Open `http://localhost:8000/api/v1/docs`
4. Confirm Swagger opens

If both work, the backend is running correctly.

---

## 11. Beginner Workflow: What To Do In The System

If you are testing the full project for the first time, follow this order.

### Step 1: Admin logs in

The admin is responsible for setting up the system.

### Step 2: Admin creates venues

Create venues first because classes need a valid venue.

For each venue:

- enter the venue name
- enter the building
- enter the capacity
- pinpoint the location on the map
- set the geofence radius

Without a properly geofenced venue, attendance check-in will not work correctly.

### Step 3: Admin creates courses

Create the academic courses that students will attend.

Examples:

- `CS101 - Introduction to Smart Systems`
- `IT201 - Database Systems`

### Step 4: Admin creates lecturer and student accounts

Create:

- lecturer accounts
- student accounts

### Step 5: Admin assigns lecturers to courses

A lecturer must be assigned to a course before they can manage classes for that course.

### Step 6: Admin enrolls students into courses

Enrollment links a student to:

- a course
- a semester
- an academic year

If a student is not enrolled, they should not be allowed to check into that course.

### Step 7: Admin issues digital IDs

Each student must have an active digital ID.

Without a valid digital ID, attendance check-in should fail.

### Step 8: Lecturer logs in

The lecturer should:

1. open `Classes`
2. click `Start Class`
3. select the course
4. select the venue
5. choose the class type
6. set start and end time
7. save the class

### Step 9: Lecturer opens check-in

Inside the class monitor:

1. open the created class
2. click `Open Check-in`
3. display the QR code to students

### Step 10: Student logs in

The student should:

1. open `Digital ID` and confirm it exists
2. open `Courses` and confirm the course is listed
3. open `Attendance` to view attendance later
4. open `Check In`
5. scan the lecturer QR code

### Step 11: Lecturer reviews attendance

After students check in:

- lecturer can view class records
- flagged records can be reviewed in `Review Queue`

---

## 12. Main URLs

### Public / local development URLs

| URL | What it is for |
|---|---|
| `http://localhost:8000/health` | Quick backend health check |
| `http://localhost:8000/api/v1/docs` | Swagger UI |
| `http://localhost:8000/api/v1/redoc` | ReDoc documentation |
| `http://localhost:8000/api/v1/openapi.json` | API schema used by the frontend client |

---

## 13. Important Backend Commands

### Start the API

```powershell
python main.py
```

From the project root:

```powershell
python main.py
```

### Apply migrations

```powershell
alembic upgrade head
```

### Create a new migration after model changes

```powershell
alembic revision --autogenerate -m "describe your change"
```

### See the current migration version

```powershell
alembic current
```

### Roll back note

The migration history was reset to a new baseline. Rolling back to the pre-baseline schema is not supported.
Only use downgrade commands for migrations created after the baseline reset.

---

## 14. API Summary

All backend routes use the prefix:

```text
/api/v1
```

### Main route groups

- `/auth`
- `/users`
- `/venues`
- `/courses`
- `/enrollments`
- `/digital-ids`
- `/attendance/sessions`
- `/attendance/records`
- `/audit`
- `/reporting`

---

## 15. Roles in the System

### Student

A student can:

- log in
- scan QR codes
- view own attendance
- view own courses
- view own digital ID

### Lecturer

A lecturer can:

- create classes for assigned courses
- edit scheduled classes
- open check-in
- refresh QR codes
- finish classes
- view attendance records
- review flagged attendance

### Admin

An admin can:

- create users
- create courses
- create venues
- manage enrollments
- issue digital IDs
- view audit logs

---

## 16. Security Rules the Backend Enforces

When a student checks in, the backend validates:

1. the class exists and is active
2. the QR code is valid and not expired
3. the student is enrolled in that course
4. the student has an active digital ID
5. the GPS location is inside the venue geofence
6. the student has not already checked in

If GPS confidence is weak, the record may be flagged for review.

---

## 17. Reseeding the Database

If you want to reset the database and repopulate it with demo data, use:

```powershell
python reset_db.py
```

What this script does:

1. drops the current schema
2. recreates the schema
3. runs Alembic migrations
4. seeds the admin account
5. seeds demo data

After reseeding, these fixed accounts are available:

- `admin@smartcampus.com` / `adminpassword123`
- `lecturer@smartcampus.com` / `password123`
- `student@smartcampus.com` / `password123`

All generated lecturer and student accounts also use the password `password123`.

### Important note

If you are actively changing models or seed scripts, reseeding may fail until the seed files are updated to match the latest backend structure.

If that happens:

1. read the error carefully
2. fix the seed script or schema mismatch
3. run `python reset_db.py` again

---

## 18. Sample Accounts

If your database has already been seeded, these are the common demo accounts:

### Admin

- Email: `admin@smartcampus.com`
- Password: `adminpassword123`

### Lecturer

- Email: `lecturer@smartcampus.com`
- Password: `password123`

### Student

- Email: `student@smartcampus.com`
- Password: `password123`

---

## 19. Common Problems and Fixes

### Problem: `ModuleNotFoundError`

Cause:

- dependencies are not installed
- virtual environment is not activated

Fix:

```powershell
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Problem: database connection failed

Cause:

- PostgreSQL is not running
- wrong username or password in `.env`
- database `smartcampus` was not created

Fix:

1. start PostgreSQL
2. check `.env`
3. make sure the database exists

### Problem: `alembic upgrade head` fails

Cause:

- wrong database configuration
- migration files out of sync
- a required file under `backend/alembic/versions/` was removed

Fix:

1. check `.env`
2. check PostgreSQL is running
3. make sure every migration file in `backend/alembic/versions/` is still present
4. read the exact Alembic error

### Problem: `alembic downgrade` fails at the baseline revision

Cause:

- the project history was intentionally reset to a new Alembic baseline

Fix:

1. treat the current schema as the starting point
2. do not downgrade below the baseline revision
3. create a forward migration instead

### Problem: `python main.py` fails

Cause:

- missing package
- `.env` values not set
- database import or migration issue

Fix:

1. activate the virtual environment
2. reinstall requirements if needed
3. check the error in the terminal

---

## 20. Folder Structure

```text
backend/
|-- alembic/
|-- app/
|   |-- main.py
|   `-- modules/
|       |-- auth/
|       |-- users/
|       |-- venues/
|       |-- courses/
|       |-- enrollment/
|       |-- digital_id/
|       |-- attendance/
|       |-- audit/
|       `-- reporting/
|-- main.py
|-- reset_db.py
|-- requirements.txt
`-- README.md
```

At the project root there is also a `main.py` launcher for convenience.

Inside each module you will usually see:

- `models/` for database tables
- `schemas/` for request and response shapes
- `services/` for business logic
- `api/v1/` for FastAPI routers

---

## 21. Final Advice for a Beginner

Do not try to do everything at once.

Use this order:

1. get PostgreSQL working
2. create `.env`
3. run migrations
4. start backend
5. open Swagger
6. test login
7. test admin setup flow
8. test lecturer class flow
9. test student check-in flow

If one step fails, stop there and fix it before moving on.
