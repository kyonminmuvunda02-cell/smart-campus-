# Smart Campus — Digital ID & Attendance Tracking System
### BSc Computer Science Final Year Project — Cavendish University Zambia

A FastAPI backend for a web-based smart campus system. Students scan a lecturer-generated,
time-limited QR code to mark attendance. The system validates: active DigitalID → correct
enrollment → GPS on campus → QR not expired. Role-Based Access Control (RBAC) governs
what Students, Lecturers, and Admins can do.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| API        | FastAPI (sync — no async DB)        |
| ORM        | SQLAlchemy 2.x (select() style)     |
| Database   | PostgreSQL                          |
| Validation | Pydantic v2                         |
| Migrations | Alembic                             |
| Auth       | JWT (python-jose) + bcrypt          |
| QR Codes   | qrcode library                      |
| Scheduling | pg_cron (bulk QR expiry sweeps)     |

---

## Quick Start

### 1. Prerequisites (Windows Setup)

- **Python 3.11+**: Download and install from [python.org](https://www.python.org/downloads/).
  - > [!IMPORTANT]
  - > During installation, **MUST check "Add Python to PATH"**.
- **Pip**: Included with Python. To verify, run `python --version` and `pip --version` in your terminal.
- **PostgreSQL 14+**: Install via [EDB Installer](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads). Ensure the service is running.

### 2. Virtual Environment & Dependencies

A virtual environment keeps the project dependencies isolated from your system Python.

```powershell
# In the backend directory:
python -m venv venv
.\venv\Scripts\activate

# Install all dependencies (FastAPI, SQLAlchemy, etc.)
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres:password@localhost/smartcampus
SECRET_KEY=your-long-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=8
QR_CODE_TTL_SECONDS=60
CORS_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development
```

> **Never commit `.env` to version control.**  
> Generate a strong `SECRET_KEY` with: `python -c "import secrets; print(secrets.token_hex(32))"`

### 4. Create the database

```bash
psql -U postgres -c "CREATE DATABASE smartcampus;"
```

### 5. Run migrations

```bash
alembic upgrade head
```

### 6. Start the server

```bash
uvicorn app.main:app --reload
```

The API is now running at **`http://localhost:8000`**

| URL | Description |
|-----|-------------|
| `http://localhost:8000/docs` | Interactive Swagger UI |
| `http://localhost:8000/redoc` | ReDoc documentation |
| `http://localhost:8000/openapi.json` | Raw OpenAPI schema (for hey-api) |
| `http://localhost:8000/health` | Liveness probe |

---

## Project Structure

```
smartcampus/
├── alembic/                    # Database migration scripts
│   ├── versions/               # Auto-generated migration files
│   ├── env.py                  # Alembic config — imports all models
│   └── script.py.mako          # Migration file template
├── app/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   └── modules/
│       ├── core/               # DB engine, settings, security, exceptions
│       ├── auth/               # Login endpoint, JWT, RBAC dependencies
│       ├── users/              # AppUser, Student, Lecturer, Admin
│       ├── venues/             # Lecture rooms
│       ├── courses/            # Course catalogue + lecturer assignments
│       ├── enrollment/         # Student ↔ Course enrollment per semester
│       ├── digital_id/         # DigitalID cards (one active per student)
│       ├── attendance/         # AttendanceSession (QR) + AttendanceRecord (check-in)
│       └── audit/              # Immutable audit log
├── requirements.txt
├── alembic.ini
└── .env.example
```

Each module follows the same four-layer pattern:

```
<module>/
  models/       # SQLAlchemy ORM definitions
  schemas/      # Pydantic v2 request / response shapes
  services/     # ALL business logic (db.flush() only — never commit)
  api/v1/       # FastAPI router — thin HTTP wrapper (db.commit() here)
```

---

## API Overview

All routes are prefixed with `/api/v1`.

### Auth
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Email + password → JWT token |
| GET | `/auth/me` | Any | Get current user's profile |

### Users
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/users/students` | Admin | Create a student account |
| POST | `/users/lecturers` | Admin | Create a lecturer account |
| GET | `/users/` | Admin | List all users |
| GET | `/users/{id}` | Admin | Get user by ID |
| PATCH | `/users/{id}` | Admin | Update user fields |
| DELETE | `/users/{id}` | Admin | Delete a user |

### Venues
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/venues/` | Admin | Create a venue |
| GET | `/venues/` | Lecturer, Admin | List all venues |
| GET | `/venues/{id}` | Lecturer, Admin | Get a venue |
| PATCH | `/venues/{id}` | Admin | Update a venue |
| DELETE | `/venues/{id}` | Admin | Delete a venue |

### Courses
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/courses/` | Admin | Create a course |
| GET | `/courses/` | All | List all courses |
| GET | `/courses/{id}` | All | Get a course |
| PATCH | `/courses/{id}` | Admin | Update a course |
| DELETE | `/courses/{id}` | Admin | Delete a course |
| POST | `/courses/assignments` | Admin | Assign lecturer to course |
| DELETE | `/courses/assignments/{lecturer_id}/{course_id}` | Admin | Remove assignment |

### Enrollment
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/enrollments/` | Admin | Enroll student in a course |
| GET | `/enrollments/students/{id}` | Student (own), Admin | List student's enrollments |
| GET | `/enrollments/courses/{id}` | Lecturer, Admin | List course's enrollments |
| PATCH | `/enrollments/{student_id}/{course_id}` | Admin | Update enrollment status |

### Digital IDs
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/digital-ids/` | Admin | Issue a DigitalID |
| GET | `/digital-ids/students/{id}/active` | Student (own), Lecturer, Admin | Get active DigitalID |
| GET | `/digital-ids/students/{id}` | Admin | List all DigitalIDs for student |
| POST | `/digital-ids/{id}/revoke` | Admin | Revoke a DigitalID |

### Attendance Sessions
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/attendance/sessions/` | Lecturer | Open a session + generate QR |
| GET | `/attendance/sessions/` | Lecturer (own), Admin | List sessions |
| GET | `/attendance/sessions/{id}` | Lecturer, Admin | Get a session |
| PATCH | `/attendance/sessions/{id}` | Lecturer, Admin | Update session fields |
| POST | `/attendance/sessions/{id}/close` | Lecturer (own) | Close a session |
| POST | `/attendance/sessions/{id}/refresh-qr` | Lecturer (own) | Generate a new QR code |

### Attendance Records
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/attendance/records/checkin` | Student | Scan QR → record attendance |
| GET | `/attendance/records/sessions/{id}` | Lecturer, Admin | All records for a session |
| GET | `/attendance/records/students/{id}` | Student (own), Lecturer, Admin | Student's history |

### Audit Log
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/audit/logs` | Admin | Query immutable audit entries |

---

## RBAC — Three Roles

| Role | Permissions |
|------|-------------|
| **Student** | Scan QR to check in, view own attendance history, view own DigitalID |
| **Lecturer** | Create/close sessions, refresh QR codes, view session attendance |
| **Admin** | Full access: users, courses, enrollment, digital IDs, audit logs |

The role is embedded in the JWT at login — `require_role()` checks it without a DB query on every request.

---

## Check-in Validation (in order)

When a student POSTs to `/attendance/records/checkin`, the server runs these checks:

1. **Session active** — `is_active=True` AND `qr_code_expiry > now()`
2. **Enrolled** — student is enrolled in the session's course for the correct semester/year with status `Enrolled`
3. **Valid DigitalID** — student has an active, non-expired DigitalID
4. **No duplicate** — student has not already checked in to this session

If GPS accuracy is `null`, `fraud_flag` is set to `true` automatically.

---

## Alembic Migrations

```bash
# After changing a model, generate a migration
alembic revision --autogenerate -m "describe what changed"

# Review the generated file in alembic/versions/ before applying

# Apply all pending migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1

# Check current revision
alembic current
```

> Always review auto-generated migrations before running them. Alembic may miss
> partial indexes and CHECK constraints — add those manually if needed.

---

## Frontend Integration (hey-api)

Every endpoint has `name` (snake_case), `operation_id` (camelCase), and `response_model` set.
This lets hey-api generate a fully typed TypeScript client directly from the OpenAPI schema:

```bash
npx @hey-api/openapi-ts \
  --input http://localhost:8000/openapi.json \
  --output src/client \
  --client @hey-api/client-fetch
```

---

## Security Notes

- Passwords hashed with **bcrypt** — never stored in plaintext
- JWT tokens embed role — no extra DB query per request
- QR codes expire in **≤ 60 seconds** — prevents screenshot/sharing fraud
- Duplicate check-ins blocked at both service layer and DB (`UNIQUE` constraint)
- `fraud_flag` auto-set when GPS accuracy is missing
- Generic login error message — does not reveal whether email or password was wrong
- All sensitive events written to the immutable `AuditLog` table

---

## Seeding & Resetting

To completely wipe the database and repopulate it with fresh test data:

```bash
python reset_db.py
```

This utility performs a schema-level `CASCADE` drop, applies all migrations, and runs both `seed_admin.py` and `seed_data.py`.

---

## Sample Accounts

**Password for all generated accounts:** `password123` (except admin)

### Admin
- **Email**: `admin@smartcampus.com`
- **Password**: `adminpassword123`

### Fixed Test Accounts (Seeder v2)
- **Lecturer**: `lecturer@smartcampus.com` / `password123`
- **Student**: `student@smartcampus.com` / `password123`

---

## Advanced Features

1.  **Geofencing**: Venues contain GPS coordinates and a radius. Check-ins are flagged if the student's location is outside the bounds.
2.  **Timetable Integration**: Recurring weekly slots are used to automatically populate session metadata.
3.  **Audit Trail**: Every mutation and authentication event is logged with detailed metadata for security review.
4.  **QR Rotation**: Lecturers can rotate the QR code during a live session to prevent static image sharing.
