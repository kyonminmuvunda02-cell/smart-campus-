import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listUsersOptions,
  getUserOptions,
  createStudentMutation,
  createLecturerMutation,
  updateUserMutation,
  deleteUserMutation,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListUsersData, GetUserData } from '@/client';
import { invalidateQueryId } from '@/utils/queryInvalidation';

export function useUser() {
  const queryClient = useQueryClient();

  const useList = (opts?: Options<ListUsersData>, enabled = true) =>
    useQuery({ ...listUsersOptions(opts), enabled });

  const useDetail = (userId?: number) =>
    useQuery({
      ...getUserOptions({ path: { user_id: userId! } } as Options<GetUserData>),
      enabled: !!userId,
    });

  const createStudent = useMutation({
    ...createStudentMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listUsers'),
  });

  const createLecturer = useMutation({
    ...createLecturerMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listUsers'),
  });

  const update = useMutation({
    ...updateUserMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listUsers'),
  });

  const remove = useMutation({
    ...deleteUserMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listUsers'),
  });

  return { useList, useDetail, createStudent, createLecturer, update, remove };
}
