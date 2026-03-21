import type { Query, QueryClient } from '@tanstack/react-query';

function matchesQueryId(query: Query, id: string) {
  const firstKey = query.queryKey[0];

  if (typeof firstKey === 'string') {
    return firstKey === id;
  }

  if (firstKey && typeof firstKey === 'object' && '_id' in firstKey) {
    return (firstKey as { _id?: unknown })._id === id;
  }

  return false;
}

export function invalidateQueryId(queryClient: QueryClient, id: string) {
  return queryClient.invalidateQueries({
    predicate: (query) => matchesQueryId(query, id),
    refetchType: 'all',
  });
}

export async function invalidateQueryIds(queryClient: QueryClient, ids: string[]) {
  await Promise.all(ids.map((id) => invalidateQueryId(queryClient, id)));
}
