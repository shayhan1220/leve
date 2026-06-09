import { z } from 'zod';

import type {
  Gathering,
  GatheringDetail,
  GatheringStatus,
  GatheringSummary,
  HostGatheringDashboard,
  HostedGathering,
  Json,
  ParticipantStatus,
} from '@/lib/supabase/database.types';
import { assertData } from '@/lib/supabase/assert-data';
import { supabase } from '@/lib/supabase/client';

export const gatheringSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(2000),
  category: z.string().trim().min(1).max(40),
  region: z.string().trim().min(1).max(40),
  capacity: z.number().int().min(2).max(100),
  start_at: z.iso.datetime(),
  type: z.enum(['meetup', 'flash']).default('meetup'),
  is_queer: z.boolean().default(false),
});

export type GatheringInput = z.input<typeof gatheringSchema>;

const gatheringSummarySchema = gatheringSchema.extend({
  id: z.string().uuid(),
  host_id: z.string().uuid(),
  status: z.enum(['pending_review', 'open', 'full', 'closed', 'canceled']),
  source: z.enum(['discover', 'queer', 'community', 'direct']),
  created_at: z.string(),
  updated_at: z.string(),
  confirmed_count: z.coerce.number().int().nonnegative(),
  applied_count: z.coerce.number().int().nonnegative(),
  my_status: z.enum(['applied', 'confirmed', 'rejected']).nullable(),
});

const eventSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  start_at: z.string(),
  status: z.enum(['upcoming', 'live', 'ended', 'canceled']),
  qr_enabled: z.boolean(),
  promo_code: z.string().nullable(),
  is_queer: z.boolean(),
});

const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  is_queer: z.boolean(),
  created_at: z.string(),
  member_count: z.coerce.number().int().nonnegative(),
  is_member: z.boolean(),
});

const communityFeedSchema = z.object({
  gatherings: z.array(gatheringSummarySchema),
  events: z.array(eventSchema),
  groups: z.array(groupSchema),
});

const gatheringDetailSchema = gatheringSummarySchema.extend({
  host_nickname: z.string().nullable(),
  host_region: z.string().nullable(),
  is_host: z.boolean(),
});

const hostedGatheringSchema = gatheringSummarySchema.omit({ my_status: true });

const hostParticipantSchema = z.object({
  id: z.string().uuid(),
  gathering_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['applied', 'confirmed', 'rejected']),
  created_at: z.string(),
  nickname: z.string().nullable(),
  age: z.number().int().nullable(),
  region: z.string().nullable(),
  bio: z.string().nullable(),
  photo_path: z.string().nullable(),
});

const hostDashboardSchema = hostedGatheringSchema.extend({
  participants: z.array(hostParticipantSchema),
});

const applicationSchema = z.object({
  id: z.string().uuid(),
  gathering_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['applied', 'confirmed', 'rejected']),
  created_at: z.string(),
  title: z.string(),
  start_at: z.string(),
  region: z.string(),
  gathering_status: z.enum(['pending_review', 'open', 'full', 'closed', 'canceled']),
});

export type CommunityFeed = z.infer<typeof communityFeedSchema>;
export type CommunityEvent = z.infer<typeof eventSchema>;
export type CommunityGroup = z.infer<typeof groupSchema>;
export type GatheringApplication = z.infer<typeof applicationSchema>;

export type GatheringQuota = {
  allowed: boolean;
  used: number;
  limit: number;
  week_start: string;
};

export async function getCommunityFeed(type?: 'meetup' | 'flash') {
  const { data, error } = await supabase.rpc('community_feed', {
    gathering_type: type ?? null,
    page_size: 20,
  });
  return communityFeedSchema.parse(assertData(data, error));
}

export async function getGatheringDetail(id: string): Promise<GatheringDetail> {
  const { data, error } = await supabase.rpc('get_gathering_detail', {
    target_id: z.string().uuid().parse(id),
  });
  return gatheringDetailSchema.parse(assertData(data, error)) as GatheringDetail;
}

export async function getHostedGatherings(): Promise<HostedGathering[]> {
  const { data, error } = await supabase.rpc('hosted_gatherings_dashboard');
  return z.array(hostedGatheringSchema).parse(assertData(data, error)) as HostedGathering[];
}

export async function getHostGathering(id: string): Promise<HostGatheringDashboard> {
  const { data, error } = await supabase.rpc('host_gathering_dashboard', {
    target_id: z.string().uuid().parse(id),
  });
  return hostDashboardSchema.parse(assertData(data, error)) as HostGatheringDashboard;
}

export async function getMyApplications() {
  const { data, error } = await supabase.rpc('applications_dashboard');
  return z.array(applicationSchema).parse(assertData(data, error));
}

export async function canCreateGathering(): Promise<GatheringQuota> {
  const { data, error } = await supabase.rpc('can_create_gathering');
  return z
    .object({
      allowed: z.boolean(),
      used: z.coerce.number().int().nonnegative(),
      limit: z.coerce.number().int().positive(),
      week_start: z.string(),
    })
    .parse(assertData(data, error));
}

export async function createGathering(input: GatheringInput): Promise<Gathering> {
  const payload = gatheringSchema.parse(input);
  const { data, error } = await supabase.rpc('create_gathering', {
    payload: payload as Json,
  });
  return assertData(data, error);
}

export async function applyGathering(gatheringId: string) {
  const { data, error } = await supabase.rpc('apply_gathering', {
    gathering_id: z.string().uuid().parse(gatheringId),
  });
  return assertData(data, error);
}

export async function reviewParticipant(participantId: string, decision: 'confirm' | 'reject') {
  const { data, error } = await supabase.rpc('review_participant', {
    participant_id: z.string().uuid().parse(participantId),
    decision,
  });
  return assertData(data, error);
}

export async function cancelGathering(id: string) {
  const { data, error } = await supabase.rpc('cancel_gathering', {
    id: z.string().uuid().parse(id),
  });
  return assertData(data, error);
}

export async function updateGathering(
  id: string,
  input: Partial<GatheringInput>,
): Promise<Gathering> {
  const payload = gatheringSchema.partial().parse(input);
  const update = {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.category !== undefined ? { category: payload.category } : {}),
    ...(payload.region !== undefined ? { region: payload.region } : {}),
    ...(payload.capacity !== undefined ? { capacity: payload.capacity } : {}),
    ...(payload.start_at !== undefined ? { start_at: payload.start_at } : {}),
    ...(payload.type !== undefined ? { type: payload.type } : {}),
    ...(payload.is_queer !== undefined ? { is_queer: payload.is_queer } : {}),
  };
  const { data, error } = await supabase
    .from('gatherings')
    .update(update)
    .eq('id', z.string().uuid().parse(id))
    .select()
    .single();
  return assertData(data, error);
}

export async function getEvent(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', z.string().uuid().parse(id))
    .single();
  return eventSchema.parse(assertData(data, error));
}

export async function getGroup(id: string) {
  const groupId = z.string().uuid().parse(id);
  const [{ data: group, error: groupError }, { data: posts, error: postsError }] =
    await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase
        .from('group_posts')
        .select('id, group_id, author_id, body, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false }),
    ]);
  return {
    group: groupSchema
      .omit({ member_count: true, is_member: true })
      .parse(assertData(group, groupError)),
    posts: assertData(posts, postsError),
  };
}

export async function createGroupPost(groupId: string, body: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  const { data, error } = await supabase
    .from('group_posts')
    .insert({
      group_id: z.string().uuid().parse(groupId),
      author_id: user.id,
      body: z.string().trim().min(1).max(2000).parse(body),
    })
    .select()
    .single();
  return assertData(data, error);
}

export function gatheringStatusLabel(status: GatheringStatus) {
  const labels: Record<GatheringStatus, string> = {
    pending_review: '검토 중',
    open: '모집 중',
    full: '마감',
    closed: '종료',
    canceled: '취소',
  };
  return labels[status];
}

export function participantStatusLabel(status: ParticipantStatus) {
  const labels: Record<ParticipantStatus, string> = {
    applied: '신청 대기',
    confirmed: '참여 확정',
    rejected: '신청 거절',
  };
  return labels[status];
}

export async function joinEvent(eventId: string) {
  const { error } = await supabase.rpc('join_event', {
    event_id: z.string().uuid().parse(eventId),
  });
  if (error) throw error;
}

export async function joinGroup(groupId: string) {
  const { error } = await supabase.rpc('join_group', {
    group_id: z.string().uuid().parse(groupId),
  });
  if (error) throw error;
}
