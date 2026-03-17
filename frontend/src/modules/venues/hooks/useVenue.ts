import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listVenuesOptions,
  getVenueOptions,
  createVenueMutation,
  updateVenueMutation,
  deleteVenueMutation,
} from '@/client/@tanstack/react-query.gen';
import type { Options, ListVenuesData, GetVenueData } from '@/client';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listVenues'] }),
  });

  const update = useMutation({
    ...updateVenueMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listVenues'] }),
  });

  const remove = useMutation({
    ...deleteVenueMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listVenues'] }),
  });

  return { useList, useDetail, create, update, remove };
}
