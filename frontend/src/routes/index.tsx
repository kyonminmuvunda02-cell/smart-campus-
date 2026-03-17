import { createBrowserRouter, redirect } from 'react-router';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import NewSessionPage from '../pages/sessions/NewSessionPage';
import SessionDetailPage from '../pages/sessions/SessionDetailPage';
import SessionListPage from '../pages/sessions/SessionListPage';
import CheckInPage from '../pages/checkin/CheckInPage';
import DigitalIDPage from '../pages/digital-id/DigitalIDPage';
import MyAttendancePage from '../pages/attendance/MyAttendancePage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import CourseManagementPage from '../pages/admin/CourseManagementPage';
import AuditLogPage from '../pages/admin/AuditLogPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import ErrorPage from '../pages/ErrorPage';

// ─── Auth Guard Helpers ───────────────────────────────────────────────────────
// These run in loader functions — outside React, so they read from localStorage directly.

function requireAuth() {
  const token = localStorage.getItem('access_token');
  if (!token) throw redirect('/login');
  return null;
}

function requireRole(...roles: string[]) {
  requireAuth();
  const role = localStorage.getItem('user_role');
  if (!role || !roles.includes(role)) throw redirect('/unauthorized');
  return null;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // All authenticated routes under AppLayout
  {
    element: <AppLayout />,
    loader: requireAuth,
    errorElement: <ErrorPage />,
    children: [
      // Dashboard — all roles
      { index: true, element: <DashboardPage /> },

      // Student-only
      {
        path: 'checkin',
        element: <CheckInPage />,
        loader: () => requireRole('Student'),
      },
      {
        path: 'my-attendance',
        element: <MyAttendancePage />,
        loader: () => requireRole('Student'),
      },
      {
        path: 'my-digital-id',
        element: <DigitalIDPage />,
        loader: () => requireRole('Student'),
      },

      // Lecturer routes
      {
        path: 'sessions/new',
        element: <NewSessionPage />,
        loader: () => requireRole('Lecturer'),
      },
      {
        path: 'sessions',
        element: <SessionListPage />,
        loader: () => requireRole('Lecturer', 'Admin'),
      },
      {
        path: 'sessions/:sessionId',
        element: <SessionDetailPage />,
        loader: () => requireRole('Lecturer', 'Admin'),
      },

      // Admin-only
      {
        path: 'admin/users',
        element: <UserManagementPage />,
        loader: () => requireRole('Admin'),
      },
      {
        path: 'admin/courses',
        element: <CourseManagementPage />,
        loader: () => requireRole('Admin'),
      },
      {
        path: 'admin/audit',
        element: <AuditLogPage />,
        loader: () => requireRole('Admin'),
      },
    ],
  },
]);
