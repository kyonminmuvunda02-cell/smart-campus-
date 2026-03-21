import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listCoursesOptions,
  getCourseOptions,
  createCourseMutation,
  updateCourseMutation,
  deleteCourseMutation,
  listCourseAssignmentsOptions,
  assignLecturerToCourseMutation,
  removeLecturerFromCourseMutation,
} from '@/client/@tanstack/react-query.gen';
import type {
  Options,
  ListCoursesData,
  GetCourseData,
  ListCourseAssignmentsData,
} from '@/client';
import { invalidateQueryId, invalidateQueryIds } from '@/utils/queryInvalidation';

export function useCourse() {
  const queryClient = useQueryClient();

  const useList = (opts?: Options<ListCoursesData>) =>
    useQuery({ ...listCoursesOptions(opts) });

  const useDetail = (courseId?: number) =>
    useQuery({
      ...getCourseOptions({ path: { course_id: courseId! } } as Options<GetCourseData>),
      enabled: !!courseId,
    });

  const useAssignments = (courseId?: number) =>
    useQuery({
      ...listCourseAssignmentsOptions({ path: { course_id: courseId! } } as Options<ListCourseAssignmentsData>),
      enabled: !!courseId,
    });

  const create = useMutation({
    ...createCourseMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listCourses'),
  });

  const update = useMutation({
    ...updateCourseMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listCourses'),
  });

  const remove = useMutation({
    ...deleteCourseMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listCourses'),
  });

  const assignLecturer = useMutation({
    ...assignLecturerToCourseMutation(),
    onSuccess: () => invalidateQueryIds(queryClient, ['listCourses', 'listCourseAssignments']),
  });

  const removeLecturer = useMutation({
    ...removeLecturerFromCourseMutation(),
    onSuccess: () => invalidateQueryIds(queryClient, ['listCourses', 'listCourseAssignments']),
  });

  return { useList, useDetail, useAssignments, create, update, remove, assignLecturer, removeLecturer };
}
