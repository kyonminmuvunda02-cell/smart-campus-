import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  studentCheckinMutation,
  listStudentRecordsOptions,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListStudentRecordsData } from '@/client';
import { invalidateQueryId } from '@/utils/queryInvalidation';

export function useAttendance() {
  const queryClient = useQueryClient();

  const useStudentRecords = (
    studentId?: number,
    query?: Options<ListStudentRecordsData>['query'],
  ) =>
    useQuery({
      ...listStudentRecordsOptions({
        path: { student_id: studentId! },
        query,
      } as Options<ListStudentRecordsData>),
      enabled: !!studentId,
    });

  const checkin = useMutation({
    ...studentCheckinMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listStudentRecords'),
  });

  return { useStudentRecords, checkin };
}
