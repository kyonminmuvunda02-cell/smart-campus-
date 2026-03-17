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

```
frontend/
├── openapi-ts.config.ts        # Configuration for hey-api code generation
├── public/                     # Static assets
└── src/
    ├── app.css                 # Global stylesheets
    ├── client/                 # Auto-generated API SDK (Do not edit directly)
    ├── components/             # Reusable UI elements (Navigation, Alerts, Loaders)
    ├── context/                # React Contexts (AuthProvider)
    ├── pages/                  # Route-level components
    │   ├── admin/              # Admin dashboard and management views
    │   ├── auth/               # LoginPage.tsx
    │   ├── lecturer/           # Session management views
    │   └── student/            # Attendance history and Digital ID views
    ├── routes/                 # React Router v7 configuration and loaders
    └── utils/                  # Helper functions (Errors, Interceptors, etc.)
```

---

## Testing locally

After running the backend seeders, you can test the application using the following accounts: 

**Admin**
- `admin@smartcampus.com` / `password123`

**Lecturers**
- `julie.king@smartcampus.com` / `password123`
- `sandra.rivera@smartcampus.com` / `password123`

**Students**
- `krista.lewis@student.smartcampus.com` / `password123`
- `harold.peters@student.smartcampus.com` / `password123`

*(These test accounts require a locally seeded database)*
