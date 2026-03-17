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

export function useUser() {
  const queryClient = useQueryClient();

  const useList = (opts?: Options<ListUsersData>) =>
    useQuery({ ...listUsersOptions(opts) });

  const useDetail = (userId?: number) =>
    useQuery({
      ...getUserOptions({ path: { user_id: userId! } } as Options<GetUserData>),
      enabled: !!userId,
    });

  const createStudent = useMutation({
    ...createStudentMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listUsers'] }),
  });

  const createLecturer = useMutation({
    ...createLecturerMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listUsers'] }),
  });

  const update = useMutation({
    ...updateUserMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listUsers'] }),
  });

  const remove = useMutation({
    ...deleteUserMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listUsers'] }),
  });

  return { useList, useDetail, createStudent, createLecturer, update, remove };
}
