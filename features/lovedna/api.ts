import { z } from 'zod';

import { assertData } from '@/lib/supabase/assert-data';
import { supabase } from '@/lib/supabase/client';

export const loveDnaResponseSchema = z.object({
  question_id: z.number().int().positive(),
  axis: z.enum(['S', 'D', 'A', 'V', 'M']),
  value: z.number().int().min(0).max(100),
});

export type LoveDnaResponseInput = z.infer<typeof loveDnaResponseSchema>;

export async function getMyLoveDnaResponses() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요해요.');

  const { data, error } = await supabase
    .from('love_dna_responses')
    .select('question_id,axis,value')
    .eq('user_id', user.id)
    .order('question_id');
  if (error) throw error;
  return data;
}

export async function saveLoveDnaResponse(input: LoveDnaResponseInput) {
  const [saved] = await saveLoveDnaResponses([input]);
  return saved;
}

export async function saveLoveDnaResponses(inputs: LoveDnaResponseInput[]) {
  const payload = z.array(loveDnaResponseSchema).min(1).max(100).parse(inputs);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요해요.');

  const { data, error } = await supabase
    .from('love_dna_responses')
    .upsert(payload.map((response) => ({ user_id: user.id, ...response })))
    .select('question_id,axis,value');
  if (error) throw error;
  return data;
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
    .select('user_id,code,clan,axis_s,axis_d,axis_a,axis_v,axis_m,answered_count,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
