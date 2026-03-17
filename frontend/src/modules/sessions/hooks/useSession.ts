import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAttendanceSessionsOptions,
  getAttendanceSessionOptions,
  createAttendanceSessionMutation,
  closeAttendanceSessionMutation,
  refreshQrCodeMutation,
  listSessionRecordsOptions,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListAttendanceSessionsData, GetAttendanceSessionData, ListSessionRecordsData } from '@/client';

export function useSession() {
  const queryClient = useQueryClient();

  const useList = (opts?: Options<ListAttendanceSessionsData>) =>
    useQuery({ ...listAttendanceSessionsOptions(opts) });

  const useDetail = (sessionId?: number) =>
    useQuery({
      ...getAttendanceSessionOptions({ path: { session_id: sessionId! } } as Options<GetAttendanceSessionData>),
      enabled: !!sessionId,
    });

  const useSessionRecords = (sessionId?: number) =>
    useQuery({
      ...listSessionRecordsOptions({ path: { session_id: sessionId! } } as Options<ListSessionRecordsData>),
      enabled: !!sessionId,
      refetchInterval: 10_000,
    });

  const create = useMutation({
    ...createAttendanceSessionMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listAttendanceSessions'] }),
  });

  const close = useMutation({
    ...closeAttendanceSessionMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listAttendanceSessions'] });
      queryClient.invalidateQueries({ queryKey: ['getAttendanceSession'] });
    },
  });

  const refreshQr = useMutation({
    ...refreshQrCodeMutation(),
  });

  return { useList, useDetail, useSessionRecords, create, close, refreshQr };
}
