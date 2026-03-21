import { Suspense, lazy, type ReactNode } from 'react';
import { createBrowserRouter, redirect } from 'react-router';

import AppLayout from '@/components/layout/AppLayout';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'));
const UserListPage = lazy(() => import('@/modules/users/pages/UserListPage'));
const UserViewPage = lazy(() => import('@/modules/users/pages/UserViewPage'));
const UserFormPage = lazy(() => import('@/modules/users/pages/UserFormPage'));
const CourseListPage = lazy(() => import('@/modules/courses/pages/CourseListPage'));
const StudentCourseListPage = lazy(() => import('@/modules/courses/pages/StudentCourseListPage'));
const CourseViewPage = lazy(() => import('@/modules/courses/pages/CourseViewPage'));
const CourseFormPage = lazy(() => import('@/modules/courses/pages/CourseFormPage'));
const VenueListPage = lazy(() => import('@/modules/venues/pages/VenueListPage'));
const VenueViewPage = lazy(() => import('@/modules/venues/pages/VenueViewPage'));
const VenueFormPage = lazy(() => import('@/modules/venues/pages/VenueFormPage'));
const SessionListPage = lazy(() => import('@/modules/sessions/pages/SessionListPage'));
const SessionViewPage = lazy(() => import('@/modules/sessions/pages/SessionViewPage'));
const SessionFormPage = lazy(() => import('@/modules/sessions/pages/SessionFormPage'));
const CheckInPage = lazy(() => import('@/modules/attendance/pages/CheckInPage'));
const AttendanceHistoryPage = lazy(() => import('@/modules/attendance/pages/AttendanceHistoryPage'));
const AttendanceReviewPage = lazy(() => import('@/modules/attendance/pages/AttendanceReviewPage'));
const DigitalIDPage = lazy(() => import('@/modules/digital-id/pages/DigitalIDPage'));
const EnrollmentListPage = lazy(() => import('@/modules/enrollment/pages/EnrollmentListPage'));
const AuditLogPage = lazy(() => import('@/modules/audit/pages/AuditLogPage'));

function requireAuth() {
  const token = localStorage.getItem('access_token');
  if (!token) throw redirect('/login');
  return null;
}

function requireGuest() {
  const token = localStorage.getItem('access_token');
  if (token) throw redirect('/');
  return null;
}

function requireRole(...roles: string[]) {
  requireAuth();
  const role = localStorage.getItem('user_role');
  if (!role || !roles.includes(role)) throw redirect('/');
  return null;
}

function renderRoute(element: ReactNode) {
  return (
    <Suspense fallback={<LoadingSkeleton rows={6} columns={4} />}>
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: renderRoute(<LoginPage />),
    loader: requireGuest,
  },
  {
    element: <AppLayout />,
    loader: requireAuth,
    children: [
      { index: true, element: renderRoute(<DashboardPage />) },

      { path: 'checkin', element: renderRoute(<CheckInPage />), loader: () => requireRole('Student') },
      { path: 'my-courses', element: renderRoute(<StudentCourseListPage />), loader: () => requireRole('Student') },
      { path: 'my-attendance', element: renderRoute(<AttendanceHistoryPage />), loader: () => requireRole('Student') },
      { path: 'my-digital-id', element: renderRoute(<DigitalIDPage />), loader: () => requireRole('Student') },

      { path: 'sessions/new', element: renderRoute(<SessionFormPage />), loader: () => requireRole('Lecturer') },
      { path: 'sessions/:id/edit', element: renderRoute(<SessionFormPage />), loader: () => requireRole('Lecturer', 'Admin') },
      { path: 'sessions/:id', element: renderRoute(<SessionViewPage />), loader: () => requireRole('Lecturer', 'Admin') },
      { path: 'sessions', element: renderRoute(<SessionListPage />), loader: () => requireRole('Lecturer', 'Admin') },
      { path: 'timetable', loader: () => redirect('/sessions') },
      { path: 'attendance-review', element: renderRoute(<AttendanceReviewPage />), loader: () => requireRole('Lecturer', 'Admin') },

      { path: 'users', element: renderRoute(<UserListPage />), loader: () => requireRole('Admin') },
      { path: 'users/new', element: renderRoute(<UserFormPage />), loader: () => requireRole('Admin') },
      { path: 'users/:id', element: renderRoute(<UserViewPage />), loader: () => requireRole('Admin') },
      { path: 'users/:id/edit', element: renderRoute(<UserFormPage />), loader: () => requireRole('Admin') },

      { path: 'courses', element: renderRoute(<CourseListPage />), loader: () => requireRole('Admin') },
      { path: 'courses/new', element: renderRoute(<CourseFormPage />), loader: () => requireRole('Admin') },
      { path: 'courses/:id', element: renderRoute(<CourseViewPage />), loader: () => requireRole('Admin') },
      { path: 'courses/:id/edit', element: renderRoute(<CourseFormPage />), loader: () => requireRole('Admin') },

      { path: 'venues', element: renderRoute(<VenueListPage />), loader: () => requireRole('Admin') },
      { path: 'venues/new', element: renderRoute(<VenueFormPage />), loader: () => requireRole('Admin') },
      { path: 'venues/:id', element: renderRoute(<VenueViewPage />), loader: () => requireRole('Admin') },
      { path: 'venues/:id/edit', element: renderRoute(<VenueFormPage />), loader: () => requireRole('Admin') },

      { path: 'enrollments', element: renderRoute(<EnrollmentListPage />), loader: () => requireRole('Admin') },
      { path: 'audit', element: renderRoute(<AuditLogPage />), loader: () => requireRole('Admin') },
    ],
  },
]);
