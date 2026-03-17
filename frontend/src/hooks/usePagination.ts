import { useState } from 'react';

export function usePagination(defaultLimit = 20) {
  const [skip, setSkip] = useState(0);
  const [limit] = useState(defaultLimit);
  const [total, setTotal] = useState(0);

  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  function goToPage(p: number) {
    setSkip((p - 1) * limit);
  }

  return { skip, limit, total, setTotal, page, totalPages, goToPage };
}
