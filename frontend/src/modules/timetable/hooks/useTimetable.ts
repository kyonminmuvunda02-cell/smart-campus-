import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/client/client.gen';

export interface TimetableItem {
  timetable_id: number;
  course_id: number;
  lecturer_id: number;
  venue_id: number;
  weekday: string;
  start_time: string;
  end_time: string;
  session_type: string;
  semester: string;
  academic_year: string;
  effective_start_date: string | null;
  effective_end_date: string | null;
  is_active: boolean;
}

export interface TimetableList {
  items: TimetableItem[];
  total: number;
  skip: number;
  limit: number;
}

interface TimetableFilters {
  course_id?: number;
  semester?: string;
  academic_year?: string;
  skip?: number;
  limit?: number;
}

interface GenerateSessionsPayload {
  start_date: string;
  end_date: string;
}

interface GenerateSessionsResponse {
  created_session_ids: number[];
  skipped_dates: string[];
}

interface TimetableMutationPayload {
  course_id: number;
  lecturer_id: number;
  venue_id: number;
  weekday: string;
  start_time: string;
  end_time: string;
  session_type: string;
  semester: string;
  academic_year: string;
  effective_start_date: string | null;
  effective_end_date: string | null;
}

export function useTimetable() {
  const queryClient = useQueryClient();

  const useList = (filters: TimetableFilters = {}) =>
    useQuery({
      queryKey: ['timetableEntries', filters],
      queryFn: async () => {
        const { data } = await client.get<TimetableList, unknown, true>({
          url: '/api/v1/attendance/timetable/',
          query: filters as Record<string, unknown>,
          throwOnError: true,
        });
        return data;
      },
    });

  const create = useMutation({
    mutationFn: async (body: TimetableMutationPayload) => {
      const { data } = await client.post<TimetableItem, unknown, true>({
        url: '/api/v1/attendance/timetable/',
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableEntries'] });
      queryClient.invalidateQueries({ queryKey: ['listAttendanceSessions'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (timetableId: number) => {
      await client.delete<unknown, unknown, true>({
        url: '/api/v1/attendance/timetable/{timetable_id}',
        path: { timetable_id: timetableId },
        throwOnError: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableEntries'] });
    },
  });

  const generateSessions = useMutation({
    mutationFn: async (body: GenerateSessionsPayload) => {
      const { data } = await client.post<GenerateSessionsResponse, unknown, true>({
        url: '/api/v1/attendance/timetable/generate-sessions',
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableEntries'] });
      queryClient.invalidateQueries({ queryKey: ['listAttendanceSessions'] });
    },
  });

  return { useList, create, remove, generateSessions };
}
