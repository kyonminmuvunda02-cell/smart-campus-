import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listCoursesOptions,
  getCourseOptions,
  createCourseMutation,
  updateCourseMutation,
  deleteCourseMutation,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListCoursesData, GetCourseData } from '@/client';

export function useCourse() {
  const queryClient = useQueryClient();

  const useList = (opts?: Options<ListCoursesData>) =>
    useQuery({ ...listCoursesOptions(opts) });

  const useDetail = (courseId?: number) =>
    useQuery({
      ...getCourseOptions({ path: { course_id: courseId! } } as Options<GetCourseData>),
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

  return { useList, useDetail, create, update, remove };
}
