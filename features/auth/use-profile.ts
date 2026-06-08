import { useQuery } from '@tanstack/react-query';

import { getMyProfile } from '@/features/auth/api';

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getMyProfile(userId!),
    enabled: Boolean(userId),
  });
}
