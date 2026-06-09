import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getDiscoverFeed,
  getMatches,
  getProfile,
  getProfilePhotoUrl,
  getWhoLikedMe,
  reactToProfile,
  type DiscoverFilters,
} from '@/features/discovery/api';

export function useDiscoverFeed(filters: DiscoverFilters) {
  return useQuery({
    queryKey: ['discover-feed', filters],
    queryFn: () => getDiscoverFeed(filters),
  });
}

export function useReactToProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, type }: { userId: string; type: 'like' | 'super' | 'pass' }) =>
      reactToProfile(userId, type),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
      void queryClient.invalidateQueries({ queryKey: ['who-liked-me'] });
    },
  });
}

export function useWhoLikedMe() {
  return useQuery({ queryKey: ['who-liked-me'], queryFn: getWhoLikedMe });
}

export function useProfileDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-detail', userId],
    queryFn: () => getProfile(userId!),
    enabled: Boolean(userId),
  });
}

export function useMatches() {
  return useQuery({ queryKey: ['matches'], queryFn: getMatches });
}

export function useProfilePhoto(path: string | null | undefined) {
  return useQuery({
    queryKey: ['profile-photo', path],
    queryFn: () => getProfilePhotoUrl(path!),
    enabled: Boolean(path),
    staleTime: 12 * 60 * 1000,
  });
}
