import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  studentCheckinMutation,
  listStudentRecordsOptions,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListStudentRecordsData } from '@/client';

export function useAttendance() {
  const queryClient = useQueryClient();

  const useStudentRecords = (studentId?: number) =>
    useQuery({
      ...listStudentRecordsOptions({ path: { student_id: studentId! } } as Options<ListStudentRecordsData>),
      enabled: !!studentId,
    });

  const checkin = useMutation({
    ...studentCheckinMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listStudentRecords'] }),
  });

  return { useStudentRecords, checkin };
}
