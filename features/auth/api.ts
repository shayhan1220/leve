import { z } from 'zod';

import { supabase } from '@/lib/supabase/client';

const phoneSchema = z.string().regex(/^01[016789]\d{7,8}$/, '올바른 휴대폰 번호를 입력해 주세요.');

function toE164(phone: string) {
  const localPhone = phoneSchema.parse(phone.replace(/\D/g, ''));
  return `+82${localPhone.slice(1)}`;
}

export async function requestOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
  if (error) throw error;
}

export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: toE164(phone),
    token: z.string().length(6).parse(token),
    type: 'sms',
  });
  if (error) throw error;
  return data.session;
}

export async function getVerification(userId: string) {
  const { data, error } = await supabase
    .from('verifications')
    .select('is_verified,is_female,age')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
