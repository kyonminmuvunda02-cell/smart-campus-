# Smart Campus — Frontend Web Application
### BSc Computer Science Final Year Project — Cavendish University Zambia

This is the frontend portal for the **CUZ Attendance System**, built with React 19 and React Router v7. It interfaces with the FastAPI backend to provide role-based dashboards for Students, Lecturers, and Administrators. 

---

## Tech Stack

| Category   | Technology                                          |
|------------|-----------------------------------------------------|
| Framework  | React 19 (using strict `useActionState` forms)      |
| Build Tool | Vite                                                |
| Routing    | React Router v7 (Data Routers + loaders)            |
| Styling    | React Bootstrap + custom CSS styling                |
| API Client | `@hey-api` (Generated from OpenAPI schema)          |
| State Mgmt | `@tanstack/react-query` (Server state)              |

---

## Features

- **Role-Based Access Control (RBAC):** UI conditionally renders based on the JWT token encoded `role` (Admin, Lecturer, Student).
- **Type-safe API Client:** All API network requests use a generated `@hey-api/client-fetch` SDK enforcing strict TypeScript interfaces matching the backend schema.
- **Form Actions:** Authentication and mutations use React 19's `useActionState` alongside native `<form action={...}>`.
- **Global Error Handling:** Axios interceptor-style global error handling parsing 401 Unauthorized returns (forces redirect) and 422 Validation Errors.
- **Route Loaders:** React Router v7 native loaders handles protected route boundaries without wrapper HOCs (Higher-Order Components).

---

## Quick Start

### 1. Prerequisites
- Node.js v20+
- The Backend server must be running at `http://localhost:8000`

### 2. Install dependencies
```bash
cd frontend
npm install
```

### 3. Start the development server
```bash
npm run dev
```
The application will be accessible at **http://localhost:5173**

---

## API Client Generation

The `/src/client` folder is automatically generated from the backend's OpenAPI schema. You should **never manually edit** files inside this directory.

Whenever the backend models or routes change, regenerate the client:

1. Ensure the backend is running (`uvicorn app.main:app --reload`)
2. Run the `hey-api` generator script:
   ```bash
   npm run generate-client
   ```

This will automatically fetch `http://localhost:8000/openapi.json` and rebuild the `sdk.gen.ts` schemas.

---

## Project Structure

The frontend uses a **Feature-Based Modular Architecture**:

```text
frontend/
├── src/
│   ├── client/              # Auto-generated API SDK
│   ├── components/          # Shared layout & common UI (Skeletons, Toasts)
│   ├── lib/                 # API client config
│   ├── modules/             # [MAJOR] Atomic feature modules
│   │   ├── attendance/      # QR scanning & history
│   │   ├── auth/            # Login & flow logic
│   │   ├── courses/         # Catalogue & View
│   │   ├── dashboard/       # Role-specific analytics
│   │   ├── venues/          # GPS & Geofence management
│   │   └── ...              # Other modules
│   ├── providers/           # Auth & Query providers
│   ├── routes/              # Lazy-loaded RBAC routing
│   └── utils/               # Labels, entity mapping, error helpers
```

---

## Key Features

-   **Geofenced Check-in**: Mobile-first scanning with Leaflet map integration for venue setup.
-   **SearchableSelect**: Robust dropdowns for searching across thousands of students or courses.
-   **Entity Mapping**: Resolves raw internal IDs into human-readable labels globally.
-   **Dynamic Dashboards**: Tailored views for Students, Lecturers, and Admins with live session tracking.

---

## Testing Locally

**Credentials for pre-seeded accounts:**

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@smartcampus.com` | `adminpassword123` |
| **Lecturer** | `lecturer@smartcampus.com` | `password123` |
| **Student** | `student@smartcampus.com` | `password123` |

*(Wipe and reseed anytime using `reset_db.py` in the backend folder.)*
