import { useQuery } from '@tanstack/react-query';

import { getVerification } from '@/features/auth/api';

export function useVerification(userId: string | undefined) {
  return useQuery({
    queryKey: ['verification', userId],
    queryFn: () => getVerification(userId!),
    enabled: Boolean(userId),
  });
}
