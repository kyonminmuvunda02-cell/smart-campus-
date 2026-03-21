import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listStudentEnrollmentsOptions,
  listCourseEnrollmentsOptions,
  createEnrollmentMutation,
  updateEnrollmentMutation,
} from '@/client/@tanstack/react-query.gen';
import { client } from '@/client/client.gen';
import type { EnrollmentList, Options, ListStudentEnrollmentsData, ListCourseEnrollmentsData } from '@/client';
import { invalidateQueryIds } from '@/utils/queryInvalidation';

type EnrollmentFilters = {
  student_id?: number;
  course_id?: number;
  semester?: string;
  academic_year?: string;
  enrollment_status?: string;
  skip?: number;
  limit?: number;
};

export function useEnrollment() {
  const queryClient = useQueryClient();

  const useList = (filters: EnrollmentFilters = {}) =>
    useQuery({
      queryKey: ['listEnrollments', filters],
      queryFn: async () => {
        const query = Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
        );
        const { data } = await client.get<EnrollmentList, unknown, true>({
          url: '/api/v1/enrollments/',
          query,
          throwOnError: true,
        });
        return data;
      },
    });

  const useStudentEnrollments = (studentId: number) =>
    useQuery({
      ...listStudentEnrollmentsOptions({ path: { student_id: studentId } } as Options<ListStudentEnrollmentsData>),
      enabled: !!studentId,
    });

  const useCourseEnrollments = (courseId: number, semester?: string, academicYear?: string) =>
    useQuery({
      ...listCourseEnrollmentsOptions({
        path: { course_id: courseId },
        query: {
          semester: semester!,
          academic_year: academicYear!,
        },
      } as Options<ListCourseEnrollmentsData>),
      enabled: !!courseId && !!semester && !!academicYear,
    });

  const create = useMutation({
    ...createEnrollmentMutation(),
    onSuccess: () => invalidateQueryIds(queryClient, ['listEnrollments', 'listStudentEnrollments', 'listCourseEnrollments']),
  });

  const update = useMutation({
    ...updateEnrollmentMutation(),
    onSuccess: () => invalidateQueryIds(queryClient, ['listEnrollments', 'listStudentEnrollments', 'listCourseEnrollments']),
  });

  return { useList, useStudentEnrollments, useCourseEnrollments, create, update };
}
