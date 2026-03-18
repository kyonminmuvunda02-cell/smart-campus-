"""Main application entry point — Smart Campus Attendance System."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from starlette.middleware.gzip import GZipMiddleware
import uvicorn

from app.modules.core.config import settings
from app.modules.core.database import check_db_connection
from app.modules.core.logging_config import setup_logging
from app.modules.core.error_handlers import register_error_handlers
from app.modules.core.utils import generate_openapi_json

# ── Logging must be configured before anything else ───────────────────────────
setup_logging()
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — runs startup checks then yields to serve requests."""

    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("🚀 Starting Smart Campus Attendance API v1.0.0")
    logger.info("   Environment : %s", settings.ENVIRONMENT)

    if check_db_connection():
        logger.info("✅ Database connection established")
    else:
        logger.warning("⚠️  Database connection failed — check DATABASE_URL in .env")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("👋 Shutting down Smart Campus API")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Smart Campus Attendance API",
    description=(
        "Digital ID and Attendance Tracking System — Cavendish University Zambia. "
        "Students scan a lecturer-generated time-limited QR code to mark attendance. "
        "The system validates: active DigitalID → correct enrollment → GPS on campus → QR not expired."
    ),
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    lifespan=lifespan,
)

# Global error handlers — consistent JSON error envelope for the TypeScript client
register_error_handlers(app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip — reduces JSON payload size ~70% on large list responses
app.add_middleware(GZipMiddleware, minimum_size=500)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"], openapi_extra={"security": []})
def health_check():
    """Liveness probe — reports DB connectivity and module status."""
    db_healthy = check_db_connection()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "connected" if db_healthy else "disconnected",
        "modules": [
            "auth", "users", "venues", "courses",
            "enrollment", "digital_id", "attendance", "audit",
        ],
    }


# ── Router registration ───────────────────────────────────────────────────────

from app.modules.auth.api.v1.auth_router import router as auth_router
from app.modules.users.api.v1.user_router import router as user_router
from app.modules.venues.api.v1.venue_router import router as venue_router
from app.modules.courses.api.v1.course_router import router as course_router
from app.modules.enrollment.api.v1.enrollment_router import router as enrollment_router
from app.modules.digital_id.api.v1.digital_id_router import router as digital_id_router
from app.modules.attendance.api.v1.session_router import router as session_router
from app.modules.attendance.api.v1.record_router import router as record_router
from app.modules.attendance.api.v1.timetable_router import router as timetable_router
from app.modules.audit.api.v1.audit_router import router as audit_router

PREFIX = "/api/v1"

app.include_router(auth_router,        prefix=PREFIX)
app.include_router(user_router,        prefix=PREFIX)
app.include_router(venue_router,       prefix=PREFIX)
app.include_router(course_router,      prefix=PREFIX)
app.include_router(enrollment_router,  prefix=PREFIX)
app.include_router(digital_id_router,  prefix=PREFIX)
app.include_router(session_router,     prefix=PREFIX)
app.include_router(record_router,      prefix=PREFIX)
app.include_router(timetable_router,   prefix=PREFIX)
app.include_router(audit_router,       prefix=PREFIX)


# ── Custom OpenAPI schema ─────────────────────────────────────────────────────

def custom_openapi():
    """Build (and cache) the OpenAPI schema.

    Adds project-level metadata and security scheme definitions on top of
    what FastAPI auto-generates, so the hey-api TypeScript client gets a
    clean, fully annotated schema to work from.
    """
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title="Smart Campus Attendance API",
        version="1.0.0",
        description=(
            "Digital ID and Attendance Tracking System — Cavendish University Zambia.\n\n"
            "**Authentication:** All protected endpoints require a `Bearer` JWT token obtained "
            "from `POST /api/v1/auth/login`.\n\n"
            "**RBAC:** Three roles — `Student`, `Lecturer`, `Admin`. "
            "The role is embedded in the JWT at login; no extra DB query per request."
        ),
        routes=app.routes,
        tags=[
            {"name": "auth",                "description": "Login and current-user profile"},
            {"name": "users",               "description": "AppUser, Student, and Lecturer account management"},
            {"name": "venues",              "description": "Lecture room management"},
            {"name": "courses",             "description": "Course catalogue and lecturer assignments"},
            {"name": "enrollments",         "description": "Student ↔ Course enrollment per semester"},
            {"name": "digital-ids",         "description": "DigitalID card issuance and revocation"},
            {"name": "attendance-sessions", "description": "QR-code attendance sessions (Lecturer)"},
            {"name": "attendance-records",  "description": "Student check-in and attendance history"},
            {"name": "audit",               "description": "Immutable audit log (Admin only)"},
            {"name": "health",              "description": "Liveness probe"},
        ],
    )

    # Add Bearer security scheme so the Swagger UI "Authorize" button works
    # and hey-api knows to attach Authorization headers automatically.
    schema.setdefault("components", {})["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token obtained from POST /api/v1/auth/login",
        }
    }

    # Apply the security scheme globally — every endpoint requires auth by default.
    # Public endpoints (e.g. /auth/login, /health) have no security requirement
    # and FastAPI will not override them.
    # Public endpoints override this with `security: []`.
    schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi

# In development, write openapi.json to disk so the frontend can run:
#   npx @hey-api/openapi-ts --input openapi.json --output src/client --client @hey-api/client-fetch
if settings.ENVIRONMENT == "development":
    try:
        generate_openapi_json(app)
    except Exception as exc:
        logger.warning("Could not write openapi.json: %s", exc)


# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  Smart Campus Attendance API  v1.0.0")
    print("=" * 60)
    print(f"  Environment : {settings.ENVIRONMENT}")
    print("  API Docs    : http://localhost:8000/api/v1/docs")
    print("  ReDoc       : http://localhost:8000/api/v1/redoc")
    print("  OpenAPI     : http://localhost:8000/api/v1/openapi.json")
    print("  Health      : http://localhost:8000/health")
    print("=" * 60)

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
