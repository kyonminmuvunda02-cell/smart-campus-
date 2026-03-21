import { useQuery } from '@tanstack/react-query';
import { client } from '@/client/client.gen';

export interface StudentAttendanceItem {
  attendance_id: number;
  session_id: number;
  session_type: string;
  course_label: string;
  checked_in_at: string;
  verification_status: string;
  fraud_flag: boolean;
}

export interface StudentEnrollmentItem {
  course_id: number;
  course_label: string;
  semester: string;
  academic_year: string;
}

export interface StudentDashboardSummary {
  records_count: number;
  verified_count: number;
  flagged_count: number;
  active_enrollments: number;
  digital_id_active: boolean;
  digital_id_expires_at: string | null;
  recent_attendance: StudentAttendanceItem[];
  enrollments: StudentEnrollmentItem[];
}

export interface LecturerLiveSessionSummary {
  session_id: number;
  session_type: string;
  course_label: string;
  venue_label: string;
  session_start: string;
  session_end: string;
  live_records: number;
  pending_reviews: number;
}

export interface LecturerUpcomingSessionItem {
  session_id: number;
  course_label: string;
  session_start: string;
}

export interface LecturerReviewItem {
  attendance_id: number;
  student_name: string;
  course_label: string;
  gps_accuracy: number | null;
  verification_status: string;
}

export interface LecturerDashboardSummary {
  active_session_count: number;
  current_verified_rate: number;
  open_review_items: number;
  live_session: LecturerLiveSessionSummary | null;
  upcoming_sessions: LecturerUpcomingSessionItem[];
  review_queue: LecturerReviewItem[];
}

export interface AuditActivityItem {
  log_id: number;
  action: string;
  actor_name: string | null;
  table_name: string | null;
  record_id: number | null;
  detail: string | null;
  created_at: string;
}

export interface AdminDashboardSummary {
  active_identities: number;
  geofenced_venues: number;
  total_venues: number;
  open_exceptions: number;
  live_sessions: number;
  latest_audit: AuditActivityItem[];
}

export interface DashboardSummaryResponse {
  role: 'Student' | 'Lecturer' | 'Admin';
  student: StudentDashboardSummary | null;
  lecturer: LecturerDashboardSummary | null;
  admin: AdminDashboardSummary | null;
}

export function useDashboard() {
  const useSummary = () =>
    useQuery({
      queryKey: ['dashboardSummary'],
      queryFn: async () => {
        const { data } = await client.get<DashboardSummaryResponse, unknown, true>({
          url: '/api/v1/reporting/dashboard-summary',
          throwOnError: true,
        });
        return data;
      },
      refetchInterval: 30000,
    });

  return { useSummary };
}
