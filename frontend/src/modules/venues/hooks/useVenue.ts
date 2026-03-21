import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listVenuesOptions,
  getVenueOptions,
  createVenueMutation,
  updateVenueMutation,
  deleteVenueMutation,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListVenuesData, GetVenueData } from '@/client';
import { invalidateQueryId } from '@/utils/queryInvalidation';

export function useVenue() {
  const queryClient = useQueryClient();

  const useList = (opts?: Options<ListVenuesData>) =>
    useQuery({ ...listVenuesOptions(opts) });

  const useDetail = (venueId?: number) =>
    useQuery({
      ...getVenueOptions({ path: { venue_id: venueId! } } as Options<GetVenueData>),
      enabled: !!venueId,
    });

  const create = useMutation({
    ...createVenueMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listVenues'),
  });

  const update = useMutation({
    ...updateVenueMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listVenues'),
  });

  const remove = useMutation({
    ...deleteVenueMutation(),
    onSuccess: () => invalidateQueryId(queryClient, 'listVenues'),
  });

  return { useList, useDetail, create, update, remove };
}
