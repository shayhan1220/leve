import { z } from 'zod';

import type { Profile } from '@/lib/supabase/database.types';
import { supabase } from '@/lib/supabase/client';

const phoneSchema = z.string().regex(/^01[016789]\d{7,8}$/, '올바른 휴대폰 번호를 입력해 주세요.');
export const profileSetupSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2자 이상 입력해 주세요.')
    .max(12, '닉네임은 12자 이하로 입력해 주세요.'),
  region: z.string().trim().min(1, '지역을 선택해 주세요.').max(40),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

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

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'user_id,nickname,age,region,height,job,bio,looking_for,identity_tags,queer_optin,queer_visible_in_main,completeness,created_at,updated_at',
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Omit<Profile, 'is_admin'> | null;
}

export async function saveProfileSetup(userId: string, input: ProfileSetupInput) {
  const parsed = profileSetupSchema.parse(input);
  const { data, error } = await supabase
    .from('profiles')
    .update(parsed)
    .eq('user_id', userId)
    .select(
      'user_id,nickname,age,region,height,job,bio,looking_for,identity_tags,queer_optin,queer_visible_in_main,completeness,created_at,updated_at',
    )
    .single();
  if (error) throw error;
  return data;
}

function extensionFor(mimeType: string | null | undefined) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadProfilePhoto(
  userId: string,
  photo: { uri: string; mimeType?: string | null },
  orderIndex: number,
) {
  const extension = extensionFor(photo.mimeType);
  const path = `${userId}/${Date.now()}-${orderIndex}.${extension}`;
  const response = await fetch(photo.uri);
  const bytes = await response.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, bytes, {
    contentType: photo.mimeType ?? 'image/jpeg',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: previous } = await supabase
    .from('profile_photos')
    .select('storage_path')
    .eq('user_id', userId)
    .eq('order_idx', orderIndex)
    .maybeSingle();

  const { error: rowError } = await supabase.from('profile_photos').upsert(
    {
      user_id: userId,
      storage_path: path,
      order_idx: orderIndex,
    },
    { onConflict: 'user_id,order_idx' },
  );

  if (rowError) {
    await supabase.storage.from('profile-photos').remove([path]);
    throw rowError;
  }

  if (previous?.storage_path && previous.storage_path !== path) {
    await supabase.storage.from('profile-photos').remove([previous.storage_path]);
  }

  return path;
}
