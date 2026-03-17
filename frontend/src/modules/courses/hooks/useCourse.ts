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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listCourses'] }),
  });

  const update = useMutation({
    ...updateCourseMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listCourses'] }),
  });

  const remove = useMutation({
    ...deleteCourseMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listCourses'] }),
  });

  const assignLecturer = useMutation({
    ...assignLecturerToCourseMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listCourses'] });
      queryClient.invalidateQueries({ queryKey: ['listCourseAssignments'] });
    },
  });

  const removeLecturer = useMutation({
    ...removeLecturerFromCourseMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listCourses'] });
      queryClient.invalidateQueries({ queryKey: ['listCourseAssignments'] });
    },
  });

  return { useList, useDetail, useAssignments, create, update, remove, assignLecturer, removeLecturer };
}
