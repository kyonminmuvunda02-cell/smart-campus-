# Smart Campus 🎓📍

A modern, full-stack campus management and attendance tracking platform built with **FastAPI**, **React 19**, **PostgreSQL**, and **Redis**. Designed for universities and colleges to streamline attendance verification through geofenced, dynamic QR code check-ins, digital student IDs, and comprehensive academic administration.

---

## ✨ Features

- **📍 Geofenced QR Code Attendance**: Dynamic, time-decaying QR codes ensure attendance can only be submitted inside the physical classroom venue with real-time GPS validation.
- **🛡️ Anti-Spoofing & Device Fingerprinting**: Prevents proxy attendance by tracking device signatures and geofence coordinates.
- **🆔 Digital Student IDs**: Verifiable digital student identity cards with scannable barcodes and real-time status validation.
- **👨‍🏫 Lecturer Class Management**: Real-time lecture session creation, attendance roster oversight, and manual override capabilities.
- **👥 Role-Based Access Control (RBAC)**: Secure, granular permissions for **Admin**, **Lecturer**, and **Student** roles.
- **📊 Comprehensive Audit & Reporting**: Complete audit logging for compliance, attendance history, review queues, and PDF/CSV reports.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, Uvicorn |
| **Frontend** | React 19, TypeScript, Vite, TanStack Query, Tabler UI, Bootstrap 5, Leaflet, QR Scanner |
| **Data & Cache** | PostgreSQL 16, Redis 7 |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## 🚀 Getting Started

You can run the project either using **Docker Compose** (recommended, one-step setup) or by running the **Backend** and **Frontend** natively.

---

### Method 1: Quickstart with Docker Compose (Recommended)

Docker Compose starts PostgreSQL, Redis, the FastAPI backend, and the React frontend with Nginx.

#### 1. Clone the repository
```bash
git clone https://github.com/kyonminmuvunda02-cell/smart-campus-.git
cd smart-campus-
```

#### 2. Start all services
```bash
docker compose --env-file .env.docker up --build
```
> Add `-d` to run in the background: `docker compose --env-file .env.docker up -d`

#### 3. Access the application
- **Frontend App**: [http://localhost:8080](http://localhost:8080)
- **Backend API Docs (Swagger UI)**: [http://localhost:8080/api/docs](http://localhost:8080/api/docs)
- **Database (PostgreSQL)**: `localhost:5433` (User: `smartcampus`, DB: `smartcampus`, Pass: `smartcampus123`)

---

### Method 2: Manual Local Setup (Development)

#### Prerequisites
- **Python 3.11+** installed
- **Node.js (v18+ or v20+)** and **npm**
- **PostgreSQL 14+** running locally (default port `5432`)
- **Redis** running locally (port `6379`)

---

### 1. Backend Setup

1. **Navigate to the backend directory and activate a virtual environment:**
   ```powershell
   # Windows PowerShell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
   ```bash
   # Linux / macOS
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   Copy the example environment file:
   ```powershell
   copy .env.example .env     # Windows
   # or
   cp .env.example .env       # Linux / macOS
   ```
   *Verify your PostgreSQL credentials in `backend/.env` (e.g. `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).*

4. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

5. **Seed initial administrative and demo data:**
   ```bash
   # Seed default admin account
   python seed_admin.py

   # (Optional) Seed realistic sample courses, lecturers, students, and sessions
   python seed_data.py
   ```

6. **Start the FastAPI backend server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Alternative ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install Node packages:**
   ```bash
   npm install
   ```

3. **Configure frontend environment:**
   Create or verify `frontend/.env`:
   ```ini
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 🔑 Default Test Credentials

After running `seed_admin.py` and `seed_data.py`, you can log in with:

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@smartcampus.com` | `adminpassword123` |
| **Lecturers** | *(Generated via `seed_data.py`)* | `password123` |
| **Students** | *(Generated via `seed_data.py`)* | `password123` |

*(To view all generated student and lecturer emails, run `python backend/get_test_users.py` or inspect the database).*

---

## 📁 Project Directory Structure

```text
smartcampus/
├── backend/
│   ├── alembic/              # Database schema migrations
│   ├── app/
│   │   └── modules/
│   │       ├── attendance/   # QR generation, geofence validation, check-in records
│   │       ├── audit/        # System audit logs and event tracking
│   │       ├── auth/         # JWT security, auth routers, RBAC dependencies
│   │       ├── core/         # Config, database engine, error handlers
│   │       ├── courses/      # Course management and lecturer assignments
│   │       ├── digital_id/   # Student digital ID cards
│   │       ├── enrollment/   # Student course enrollments
│   │       ├── users/        # Users, Lecturers, Students, Admins
│   │       └── venues/       # Campus venues with GPS geofence coordinates
│   ├── seed_admin.py         # Creates the initial admin account
│   ├── seed_data.py          # Populates realistic demo dataset
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── client/           # Auto-generated OpenAPI TypeScript client
│   │   ├── components/       # UI layout, headers, navigation, guards
│   │   ├── modules/          # Attendance, courses, venues, audit, auth pages
│   │   └── routes/           # Protected routing and page views
│   ├── nginx.conf            # Production Nginx reverse proxy configuration
│   └── package.json          # Frontend dependencies and build scripts
├── docker-compose.yml        # Orchestration for DB, Redis, API, and Frontend
└── README.md                 # Project setup and documentation
```

---

## 🔄 Updating OpenAPI Client (Frontend)

Whenever the backend API changes, the TypeScript client in the frontend can be regenerated with:

```bash
cd frontend
npm run generate-client
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
