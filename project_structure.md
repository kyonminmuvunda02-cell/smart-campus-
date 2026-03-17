# Smart Campus Project Structure

```text
└── smartcampus/
    ├── backend/
    │   ├── alembic/
    │   │   ├── versions/
    │   │   │   ├── 0a2cfde07ed1_add_device_id_fingerprint_tracking.py
    │   │   │   ├── 1ad02d6abf6a_initial_schema.py
    │   │   │   ├── 45b4f401484b_add_soft_delete_columns_is_deleted_and_.py
    │   │   │   └── __init__.py
    │   │   ├── env.py
    │   │   └── script.py.mako
    │   ├── app/
    │   │   ├── modules/
    │   │   │   ├── attendance/
    │   │   │   │   ├── api/
    │   │   │   │   │   ├── v1/
    │   │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   │   ├── record_router.py
    │   │   │   │   │   │   └── session_router.py
    │   │   │   │   │   └── __init__.py
    │   │   │   │   ├── models/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   ├── record.py
    │   │   │   │   │   └── session.py
    │   │   │   │   ├── schemas/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── attendance.py
    │   │   │   │   └── services/
    │   │   │   │       ├── __init__.py
    │   │   │   │       ├── checkin_service.py
    │   │   │   │       ├── qr_service.py
    │   │   │   │       └── session_service.py
    │   │   │   ├── audit/
    │   │   │   │   ├── api/
    │   │   │   │   │   ├── v1/
    │   │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   │   └── audit_router.py
    │   │   │   │   │   └── __init__.py
    │   │   │   │   ├── models/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── audit_log.py
    │   │   │   │   ├── schemas/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── audit_log.py
    │   │   │   │   └── services/
    │   │   │   │       ├── __init__.py
    │   │   │   │       └── audit_service.py
    │   │   │   ├── auth/
    │   │   │   │   ├── api/
    │   │   │   │   │   ├── v1/
    │   │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   │   └── auth_router.py
    │   │   │   │   │   └── __init__.py
    │   │   │   │   ├── __init__.py
    │   │   │   │   └── dependencies.py
    │   │   │   ├── core/
    │   │   │   │   ├── __init__.py
    │   │   │   │   ├── config.py
    │   │   │   │   ├── database.py
    │   │   │   │   ├── error_handlers.py
    │   │   │   │   ├── exceptions.py
    │   │   │   │   ├── logging_config.py
    │   │   │   │   ├── security.py
    │   │   │   │   └── utils.py
    │   │   │   ├── courses/
    │   │   │   │   ├── api/
    │   │   │   │   │   ├── v1/
    │   │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   │   └── course_router.py
    │   │   │   │   │   └── __init__.py
    │   │   │   │   ├── models/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── course.py
    │   │   │   │   ├── schemas/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── course.py
    │   │   │   │   └── services/
    │   │   │   │       ├── __init__.py
    │   │   │   │       └── course_service.py
    │   │   │   ├── digital_id/
    │   │   │   │   ├── api/
    │   │   │   │   │   ├── v1/
    │   │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   │   └── digital_id_router.py
    │   │   │   │   │   └── __init__.py
    │   │   │   │   ├── models/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── digital_id.py
    │   │   │   │   ├── schemas/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── digital_id.py
    │   │   │   │   └── services/
    │   │   │   │       ├── __init__.py
    │   │   │   │       └── digital_id_service.py
    │   │   │   ├── enrollment/
    │   │   │   │   ├── api/
    │   │   │   │   │   ├── v1/
    │   │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   │   └── enrollment_router.py
    │   │   │   │   │   └── __init__.py
    │   │   │   │   ├── models/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── enrollment.py
    │   │   │   │   ├── schemas/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── enrollment.py
    │   │   │   │   └── services/
    │   │   │   │       ├── __init__.py
    │   │   │   │       └── enrollment_service.py
    │   │   │   ├── users/
    │   │   │   │   ├── api/
    │   │   │   │   │   ├── v1/
    │   │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   │   └── user_router.py
    │   │   │   │   │   └── __init__.py
    │   │   │   │   ├── models/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   ├── admin.py
    │   │   │   │   │   ├── lecturer.py
    │   │   │   │   │   ├── student.py
    │   │   │   │   │   └── user.py
    │   │   │   │   ├── schemas/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── user.py
    │   │   │   │   └── services/
    │   │   │   │       ├── __init__.py
    │   │   │   │       └── user_service.py
    │   │   │   ├── venues/
    │   │   │   │   ├── api/
    │   │   │   │   │   ├── v1/
    │   │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   │   └── venue_router.py
    │   │   │   │   │   └── __init__.py
    │   │   │   │   ├── models/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── venue.py
    │   │   │   │   ├── schemas/
    │   │   │   │   │   ├── __init__.py
    │   │   │   │   │   └── venue.py
    │   │   │   │   └── services/
    │   │   │   │       ├── __init__.py
    │   │   │   │       └── venue_service.py
    │   │   │   └── __init__.py
    │   │   ├── __init__.py
    │   │   └── main.py
    │   ├── frontend/
    │   │   ├── openapi.hash
    │   │   └── openapi.json
    │   ├── .env
    │   ├── .env.example
    │   ├── alembic.ini
    │   ├── alembic.log
    │   ├── get_test_users.py
    │   ├── openapi.json
    │   ├── README.md
    │   ├── requirements.txt
    │   ├── seed_admin.py
    │   └── seed_data.py
    ├── frontend/
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── attendance/
    │   │   │   │   └── AttendanceTable.tsx
    │   │   │   ├── common/
    │   │   │   │   ├── ConfirmModal.tsx
    │   │   │   │   └── PageHeader.tsx
    │   │   │   ├── layout/
    │   │   │   │   ├── AppLayout.tsx
    │   │   │   │   ├── Sidebar.tsx
    │   │   │   │   └── TopNavbar.tsx
    │   │   │   └── qr/
    │   │   │       └── QRDisplay.tsx
    │   │   ├── context/
    │   │   │   └── AuthContext.tsx
    │   │   ├── hooks/
    │   │   │   ├── useCountdown.ts
    │   │   │   ├── usePagination.ts
    │   │   │   └── useRole.ts
    │   │   ├── pages/
    │   │   │   ├── admin/
    │   │   │   │   ├── AuditLogPage.tsx
    │   │   │   │   ├── CourseManagementPage.tsx
    │   │   │   │   └── UserManagementPage.tsx
    │   │   │   ├── attendance/
    │   │   │   │   └── MyAttendancePage.tsx
    │   │   │   ├── auth/
    │   │   │   │   └── LoginPage.tsx
    │   │   │   ├── checkin/
    │   │   │   │   └── CheckInPage.tsx
    │   │   │   ├── dashboard/
    │   │   │   │   └── DashboardPage.tsx
    │   │   │   ├── digital-id/
    │   │   │   │   └── DigitalIDPage.tsx
    │   │   │   ├── sessions/
    │   │   │   │   ├── NewSessionPage.tsx
    │   │   │   │   ├── SessionDetailPage.tsx
    │   │   │   │   └── SessionListPage.tsx
    │   │   │   ├── ErrorPage.tsx
    │   │   │   └── UnauthorizedPage.tsx
    │   │   ├── routes/
    │   │   │   └── index.tsx
    │   │   ├── types/
    │   │   │   └── index.ts
    │   │   ├── utils/
    │   │   │   ├── api.ts
    │   │   │   ├── errors.ts
    │   │   │   └── gps.ts
    │   │   ├── {client,components/
    │   │   │   └── {common,layout,qr,attendance},pages/
    │   │   │       └── {auth,dashboard,sessions,checkin,digital-id,admin,attendance},hooks,context,utils,routes,types}/
    │   │   ├── main.tsx
    │   │   └── vite-env.d.ts
    │   ├── .env
    │   ├── index.html
    │   ├── openapi-ts.config.ts
    │   ├── openapi.hash
    │   ├── openapi.json
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── README.md
    │   ├── SKILL.md
    │   ├── tsconfig.json
    │   ├── tsconfig.node.json
    │   └── vite.config.ts
    ├── .gitignore
    └── generate_tree.py
```
