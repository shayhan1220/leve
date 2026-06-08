import { z } from 'zod';

import type { Json, ReactionType } from '@/lib/supabase/database.types';
import { assertData } from '@/lib/supabase/assert-data';
import { supabase } from '@/lib/supabase/client';

export const discoverFiltersSchema = z.object({
  region: z.string().min(1).optional(),
  queer: z.boolean().optional(),
  max_distance_km: z.number().positive().max(500).optional(),
  verified_only: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const reactionSchema = z.object({
  to_user: z.string().uuid(),
  type: z.enum(['like', 'super', 'pass']),
});

export async function getDiscoverFeed(
  filters: z.input<typeof discoverFiltersSchema>,
  cursor?: string,
) {
  const parsed = discoverFiltersSchema.parse(filters);
  const { data, error } = await supabase.rpc('discover_feed', {
    filters: parsed as Json,
    cursor: cursor ?? null,
  });
  if (error) throw error;
  return data;
}

export async function reactToProfile(toUser: string, type: ReactionType) {
  const input = reactionSchema.parse({ to_user: toUser, type });
  const { data, error } = await supabase.rpc('react', input);
  return assertData(data, error);
}

export async function getWhoLikedMe() {
  const { data, error } = await supabase.rpc('who_liked_me');
  return assertData(data, error);
}

export async function getProfile(targetId: string) {
  const { data, error } = await supabase.rpc('get_profile', {
    target_id: z.string().uuid().parse(targetId),
  });
  return assertData(data, error);
}
