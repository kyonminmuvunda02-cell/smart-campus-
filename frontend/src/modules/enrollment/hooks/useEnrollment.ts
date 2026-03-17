import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listStudentEnrollmentsOptions,
  listCourseEnrollmentsOptions,
  createEnrollmentMutation,
  updateEnrollmentMutation,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListStudentEnrollmentsData, ListCourseEnrollmentsData } from '@/client';

export function useEnrollment() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listStudentEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['listCourseEnrollments'] });
    },
  });

  const update = useMutation({
    ...updateEnrollmentMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listStudentEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['listCourseEnrollments'] });
    },
  });

  return { useStudentEnrollments, useCourseEnrollments, create, update };
}
