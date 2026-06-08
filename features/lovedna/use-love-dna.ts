import { useQuery } from '@tanstack/react-query';

import { getMyLoveDna } from '@/features/lovedna/api';

export function useLoveDna(enabled: boolean) {
  return useQuery({
    queryKey: ['love-dna', 'me'],
    queryFn: getMyLoveDna,
    enabled,
  });
}
