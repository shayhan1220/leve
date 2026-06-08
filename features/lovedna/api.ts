import { z } from 'zod';

import { assertData } from '@/lib/supabase/assert-data';
import { supabase } from '@/lib/supabase/client';

export const loveDnaResponseSchema = z.object({
  question_id: z.number().int().positive(),
  axis: z.enum(['S', 'D', 'A', 'V', 'M']),
  value: z.number().int().min(0).max(100),
});

export type LoveDnaResponseInput = z.infer<typeof loveDnaResponseSchema>;

export async function saveLoveDnaResponse(input: LoveDnaResponseInput) {
  const payload = loveDnaResponseSchema.parse(input);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요해요.');

  const { error } = await supabase.from('love_dna_responses').upsert({
    user_id: user.id,
    ...payload,
  });
  if (error) throw error;
}

export async function computeLoveDna() {
  const { data, error } = await supabase.rpc('compute_love_dna');
  return assertData(data, error);
}

export async function getMyLoveDna() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요해요.');
  const { data, error } = await supabase
    .from('love_dna_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  return assertData(data, error);
}
