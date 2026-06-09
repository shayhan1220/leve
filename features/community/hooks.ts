import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  applyGathering,
  cancelGathering,
  canCreateGathering,
  createGathering,
  createGroupPost,
  getCommunityFeed,
  getEvent,
  getGatheringDetail,
  getGroup,
  getHostedGatherings,
  getHostGathering,
  getMyApplications,
  joinEvent,
  joinGroup,
  reviewParticipant,
  updateGathering,
  type GatheringInput,
} from '@/features/community/api';

const invalidateCommunity = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: ['community'] });
  void queryClient.invalidateQueries({ queryKey: ['gathering'] });
  void queryClient.invalidateQueries({ queryKey: ['hosted-gatherings'] });
  void queryClient.invalidateQueries({ queryKey: ['host-gathering'] });
  void queryClient.invalidateQueries({ queryKey: ['my-applications'] });
};

export function useCommunityFeed(type?: 'meetup' | 'flash') {
  return useQuery({
    queryKey: ['community', type ?? 'all'],
    queryFn: () => getCommunityFeed(type),
  });
}

export function useGatheringDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['gathering', id],
    queryFn: () => getGatheringDetail(id!),
    enabled: Boolean(id),
  });
}

export function useGatheringQuota(enabled = true) {
  return useQuery({
    queryKey: ['gathering-quota'],
    queryFn: canCreateGathering,
    enabled,
  });
}

export function useCreateGathering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GatheringInput) => createGathering(input),
    onSuccess: () => invalidateCommunity(queryClient),
  });
}

export function useApplyGathering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyGathering,
    onSuccess: () => invalidateCommunity(queryClient),
  });
}

export function useHostedGatherings() {
  return useQuery({ queryKey: ['hosted-gatherings'], queryFn: getHostedGatherings });
}

export function useHostGathering(id: string | undefined) {
  return useQuery({
    queryKey: ['host-gathering', id],
    queryFn: () => getHostGathering(id!),
    enabled: Boolean(id),
  });
}

export function useReviewParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participantId,
      decision,
    }: {
      participantId: string;
      decision: 'confirm' | 'reject';
    }) => reviewParticipant(participantId, decision),
    onSuccess: () => invalidateCommunity(queryClient),
  });
}

export function useCancelGathering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelGathering,
    onSuccess: () => invalidateCommunity(queryClient),
  });
}

export function useUpdateGathering(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<GatheringInput>) => updateGathering(id, input),
    onSuccess: () => invalidateCommunity(queryClient),
  });
}

export function useMyApplications() {
  return useQuery({ queryKey: ['my-applications'], queryFn: getMyApplications });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: Boolean(id),
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinEvent,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['event'] }),
  });
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => getGroup(id!),
    enabled: Boolean(id),
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community'] });
      void queryClient.invalidateQueries({ queryKey: ['group'] });
    },
  });
}

export function useCreateGroupPost(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createGroupPost(groupId, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['group', groupId] }),
  });
}
