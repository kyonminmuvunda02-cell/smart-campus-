import { useQuery } from '@tanstack/react-query';
import {
  listAuditLogsOptions,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListAuditLogsData } from '@/client';

export function useAudit() {
  const useList = (opts?: Options<ListAuditLogsData>) =>
    useQuery({ ...listAuditLogsOptions(opts) });

  return { useList };
}
