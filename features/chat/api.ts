import { z } from 'zod';

import type { Database } from '@/lib/supabase/database.types';
import { supabase } from '@/lib/supabase/client';

type Message = Database['public']['Tables']['messages']['Row'];

export const messageSchema = z
  .object({
    chat_id: z.string().uuid(),
    type: z.enum(['text', 'image']),
    body: z.string().trim().max(4000).nullable().default(null),
    storage_path: z.string().max(1024).nullable().default(null),
  })
  .refine((value) => (value.type === 'text' ? Boolean(value.body) : Boolean(value.storage_path)), {
    message: '메시지 내용을 확인해 주세요.',
  });

export async function getMessages(chatId: string, before?: string) {
  const { data, error } = await supabase.rpc('list_chat_messages', {
    target_chat_id: z.string().uuid().parse(chatId),
    before_at: before ? z.iso.datetime().parse(before) : null,
    page_size: 30,
  });
  if (error) throw error;
  return data satisfies Message[];
}

export async function sendMessage(input: z.input<typeof messageSchema>, senderId: string) {
  const payload = messageSchema.parse(input);
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...payload, sender_id: z.string().uuid().parse(senderId) })
    .select('id,chat_id,sender_id,type,body,storage_path,created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function markChatRead(chatId: string) {
  const { data, error } = await supabase.rpc('mark_read', {
    chat_id: z.string().uuid().parse(chatId),
  });
  if (error) throw error;
  return data;
}

export const dateProposalSchema = z.object({
  chat_id: z.string().uuid(),
  datetime: z.iso.datetime(),
  place: z.string().trim().min(2).max(120),
  note: z.string().trim().max(500).optional(),
});

export async function getDateProposals(chatId: string) {
  const { data, error } = await supabase
    .from('date_proposals')
    .select('*')
    .eq('chat_id', z.string().uuid().parse(chatId))
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDateProposal(input: z.input<typeof dateProposalSchema>) {
  const parsed = dateProposalSchema.parse(input);
  const { data, error } = await supabase.rpc('create_date_proposal', {
    target_chat_id: parsed.chat_id,
    proposed_at: parsed.datetime,
    proposed_place: parsed.place,
    note: parsed.note ?? null,
  });
  if (error) throw error;
  return data;
}

export async function respondToDateProposal(proposalId: string, status: 'accepted' | 'declined') {
  const { data, error } = await supabase
    .from('date_proposals')
    .update({ status })
    .eq('id', z.string().uuid().parse(proposalId))
    .select()
    .single();
  if (error) throw error;
  return data;
}

function extensionFor(mimeType: string | null | undefined) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'heic';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

export async function uploadMessageImage(
  chatId: string,
  image: { uri: string; mimeType?: string | null },
) {
  const validChatId = z.string().uuid().parse(chatId);
  const path = `${validChatId}/${Date.now()}.${extensionFor(image.mimeType)}`;
  const response = await fetch(image.uri);
  const bytes = await response.arrayBuffer();
  const { error } = await supabase.storage.from('message-images').upload(path, bytes, {
    contentType: image.mimeType ?? 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getMessageImageUrl(path: string) {
  const { data, error } = await supabase.storage
    .from('message-images')
    .createSignedUrl(z.string().min(1).parse(path), 900);
  if (error) throw error;
  return data.signedUrl;
}

export function subscribeToMessages(chatId: string, onChange: () => void) {
  return supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'date_proposals', filter: `chat_id=eq.${chatId}` },
      onChange,
    )
    .subscribe();
}
