import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/client/client.gen';
import { invalidateQueryIds } from '@/utils/queryInvalidation';

export interface AttendanceReviewItem {
  attendance_id: number;
  session_id: number;
  student_id: number;
  device_id: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_accuracy: number | null;
  verification_status: string;
  fraud_flag: boolean;
  checked_in_at: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_note: string | null;
  course_id: number;
  venue_id: number;
  lecturer_id: number;
  session_start: string;
  session_end: string;
  session_type: string;
}

export interface AttendanceReviewList {
  items: AttendanceReviewItem[];
  total: number;
  skip: number;
  limit: number;
}

interface ReviewFilters {
  verification_status?: string;
  session_id?: number;
  skip?: number;
  limit?: number;
}

interface ReviewMutationPayload {
  verification_status: string;
  review_note?: string | null;
}

export function useAttendanceReview() {
  const queryClient = useQueryClient();

  const useQueue = (filters: ReviewFilters = {}) =>
    useQuery({
      queryKey: ['attendanceReviewQueue', filters],
      queryFn: async () => {
        const { data } = await client.get<AttendanceReviewList, unknown, true>({
          url: '/api/v1/attendance/records/review-queue',
          query: filters as Record<string, unknown>,
          throwOnError: true,
        });
        return data;
      },
      refetchInterval: 15000,
    });

  const review = useMutation({
    mutationFn: async ({ attendanceId, body }: { attendanceId: number; body: ReviewMutationPayload }) => {
      const { data } = await client.patch<unknown, unknown, true>({
        url: '/api/v1/attendance/records/{attendance_id}/review',
        path: { attendance_id: attendanceId },
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => invalidateQueryIds(queryClient, ['attendanceReviewQueue', 'listAttendanceSessions']),
  });

  return { useQueue, review };
}
