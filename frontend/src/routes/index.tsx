import { createBrowserRouter, redirect } from 'react-router';
import AppLayout from '@/components/layout/AppLayout';

import LoginPage from '@/modules/auth/pages/LoginPage';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';
import UserListPage from '@/modules/users/pages/UserListPage';
import UserViewPage from '@/modules/users/pages/UserViewPage';
import UserFormPage from '@/modules/users/pages/UserFormPage';
import CourseListPage from '@/modules/courses/pages/CourseListPage';
import CourseViewPage from '@/modules/courses/pages/CourseViewPage';
import CourseFormPage from '@/modules/courses/pages/CourseFormPage';
import VenueListPage from '@/modules/venues/pages/VenueListPage';
import VenueViewPage from '@/modules/venues/pages/VenueViewPage';
import VenueFormPage from '@/modules/venues/pages/VenueFormPage';
import SessionListPage from '@/modules/sessions/pages/SessionListPage';
import SessionViewPage from '@/modules/sessions/pages/SessionViewPage';
import SessionFormPage from '@/modules/sessions/pages/SessionFormPage';
import CheckInPage from '@/modules/attendance/pages/CheckInPage';
import AttendanceHistoryPage from '@/modules/attendance/pages/AttendanceHistoryPage';
import AttendanceReviewPage from '@/modules/attendance/pages/AttendanceReviewPage';
import DigitalIDPage from '@/modules/digital-id/pages/DigitalIDPage';
import EnrollmentListPage from '@/modules/enrollment/pages/EnrollmentListPage';
import AuditLogPage from '@/modules/audit/pages/AuditLogPage';
import TimetablePage from '@/modules/timetable/pages/TimetablePage';

function requireAuth() {
  const token = localStorage.getItem('access_token');
  if (!token) throw redirect('/login');
  return null;
}

function requireRole(...roles: string[]) {
  requireAuth();
  const role = localStorage.getItem('user_role');
  if (!role || !roles.includes(role)) throw redirect('/');
  return null;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AppLayout />,
    loader: requireAuth,
    children: [
      { index: true, element: <DashboardPage /> },

      // Student
      { path: 'checkin', element: <CheckInPage />, loader: () => requireRole('Student') },
      { path: 'my-attendance', element: <AttendanceHistoryPage />, loader: () => requireRole('Student') },
      { path: 'my-digital-id', element: <DigitalIDPage />, loader: () => requireRole('Student') },

      // Lecturer
      { path: 'sessions/new', element: <SessionFormPage />, loader: () => requireRole('Lecturer') },
      { path: 'sessions/:id', element: <SessionViewPage />, loader: () => requireRole('Lecturer', 'Admin') },
      { path: 'sessions', element: <SessionListPage />, loader: () => requireRole('Lecturer', 'Admin') },
      { path: 'timetable', element: <TimetablePage />, loader: () => requireRole('Lecturer', 'Admin') },
      { path: 'attendance-review', element: <AttendanceReviewPage />, loader: () => requireRole('Lecturer', 'Admin') },

      // Admin: Users CRUD
      { path: 'users', element: <UserListPage />, loader: () => requireRole('Admin') },
      { path: 'users/new', element: <UserFormPage />, loader: () => requireRole('Admin') },
      { path: 'users/:id', element: <UserViewPage />, loader: () => requireRole('Admin') },
      { path: 'users/:id/edit', element: <UserFormPage />, loader: () => requireRole('Admin') },

      // Admin: Courses CRUD
      { path: 'courses', element: <CourseListPage />, loader: () => requireRole('Admin') },
      { path: 'courses/new', element: <CourseFormPage />, loader: () => requireRole('Admin') },
      { path: 'courses/:id', element: <CourseViewPage />, loader: () => requireRole('Admin') },
      { path: 'courses/:id/edit', element: <CourseFormPage />, loader: () => requireRole('Admin') },

      // Admin: Venues CRUD
      { path: 'venues', element: <VenueListPage />, loader: () => requireRole('Admin') },
      { path: 'venues/new', element: <VenueFormPage />, loader: () => requireRole('Admin') },
      { path: 'venues/:id', element: <VenueViewPage />, loader: () => requireRole('Admin') },
      { path: 'venues/:id/edit', element: <VenueFormPage />, loader: () => requireRole('Admin') },

      // Admin: Enrollments
      { path: 'enrollments', element: <EnrollmentListPage />, loader: () => requireRole('Admin') },

      // Admin: Audit
      { path: 'audit', element: <AuditLogPage />, loader: () => requireRole('Admin') },
    ],
  },
]);
