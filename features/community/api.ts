import { z } from 'zod';

import type { Json } from '@/lib/supabase/database.types';
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

export async function canCreateGathering() {
  const { data, error } = await supabase.rpc('can_create_gathering');
  return assertData(data, error);
}

export async function createGathering(input: GatheringInput) {
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
