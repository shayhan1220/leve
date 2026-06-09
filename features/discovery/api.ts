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

const reactionResultSchema = z.object({
  matched: z.boolean(),
  match_id: z.string().uuid().optional(),
  chat_id: z.string().uuid().optional(),
});

const whoLikedPersonSchema = z.object({
  user_id: z.string().uuid(),
  nickname: z.string().nullable(),
  age: z.number().int().nullable(),
  region: z.string().nullable(),
  type: z.enum(['like', 'super']),
  created_at: z.string(),
  photo_path: z.string().nullable(),
});

const whoLikedMeSchema = z.object({
  count: z.number().int().nonnegative(),
  revealed: z.boolean(),
  people: z.array(whoLikedPersonSchema),
});

const profileSchema = z.object({
  user_id: z.string().uuid(),
  nickname: z.string().nullable(),
  age: z.number().int().nullable(),
  region: z.string().nullable(),
  height: z.number().int().nullable(),
  job: z.string().nullable(),
  bio: z.string().nullable(),
  looking_for: z.array(z.string()),
  identity_tags: z.array(z.string()),
  queer_optin: z.boolean(),
  queer_visible_in_main: z.boolean(),
  completeness: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

const loveDnaSchema = z
  .object({
    code: z.string(),
    clan: z.enum(['Explorer', 'Dreamer', 'Thinker', 'Caregiver', 'Protector', 'Builder']),
    axis_s: z.coerce.number(),
    axis_d: z.coerce.number(),
    axis_a: z.coerce.number(),
    axis_v: z.coerce.number(),
    axis_m: z.coerce.number(),
    answered_count: z.number().int(),
  })
  .nullable();

const profileResultSchema = z.object({
  profile: profileSchema,
  photos: z.array(z.object({ storage_path: z.string(), order_idx: z.number().int() })),
  badges: z.array(z.enum(['female_safe', 'identity', 'job', 'vip'])),
  love_dna: loveDnaSchema,
});

const matchListItemSchema = z.object({
  match_id: z.string().uuid(),
  chat_id: z.string().uuid(),
  matched_at: z.string(),
  user_id: z.string().uuid(),
  nickname: z.string().nullable(),
  age: z.number().int().nullable(),
  region: z.string().nullable(),
  bio: z.string().nullable(),
  photo_path: z.string().nullable(),
  last_message: z.string().nullable(),
  last_message_at: z.string().nullable(),
  unread_count: z.number().int().nonnegative(),
});

export type DiscoverFilters = z.input<typeof discoverFiltersSchema>;
export type ReactionResult = z.infer<typeof reactionResultSchema>;
export type WhoLikedMe = z.infer<typeof whoLikedMeSchema>;
export type ProfileResult = z.infer<typeof profileResultSchema>;
export type MatchListItem = z.infer<typeof matchListItemSchema>;

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
  return reactionResultSchema.parse(assertData(data, error));
}

export async function getWhoLikedMe() {
  const { data, error } = await supabase.rpc('who_liked_me');
  return whoLikedMeSchema.parse(assertData(data, error));
}

export async function getProfile(targetId: string) {
  const { data, error } = await supabase.rpc('get_profile', {
    target_id: z.string().uuid().parse(targetId),
  });
  return profileResultSchema.parse(assertData(data, error));
}

export async function getMatches() {
  const { data, error } = await supabase.rpc('list_matches');
  return z.array(matchListItemSchema).parse(assertData(data, error));
}

export async function getProfilePhotoUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('profile-photos').createSignedUrl(path, 900);
  if (error) throw error;
  return data.signedUrl;
}
