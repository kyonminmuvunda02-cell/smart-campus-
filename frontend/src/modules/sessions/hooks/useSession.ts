import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAttendanceSessionsOptions,
  getAttendanceSessionOptions,
  createAttendanceSessionMutation,
  updateAttendanceSessionMutation,
  startAttendanceSessionMutation,
  closeAttendanceSessionMutation,
  refreshQrCodeMutation,
  listSessionRecordsOptions,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListAttendanceSessionsData, GetAttendanceSessionData, ListSessionRecordsData } from '@/client';
import { invalidateQueryId, invalidateQueryIds } from '@/utils/queryInvalidation';

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
      // Keep the lecturer roster fresh during live attendance without manual refresh clicks.
      refetchInterval: 10_000,
    });

  const create = useMutation({
    ...createAttendanceSessionMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listAttendanceSessions'),
  });

  const start = useMutation({
    ...startAttendanceSessionMutation(),
    onSuccess: () => invalidateQueryIds(queryClient, ['listAttendanceSessions', 'getAttendanceSession']),
  });

  const update = useMutation({
    ...updateAttendanceSessionMutation(),
    onSuccess: () => invalidateQueryIds(queryClient, ['listAttendanceSessions', 'getAttendanceSession', 'listSessionRecords']),
  });

  const close = useMutation({
    ...closeAttendanceSessionMutation(),
    onSuccess: () => invalidateQueryIds(queryClient, ['listAttendanceSessions', 'getAttendanceSession']),
  });

  const refreshQr = useMutation({
    ...refreshQrCodeMutation(),
    onSuccess: () => invalidateQueryIds(queryClient, ['listAttendanceSessions', 'getAttendanceSession']),
  });

  return { useList, useDetail, useSessionRecords, create, update, start, close, refreshQr };
}
