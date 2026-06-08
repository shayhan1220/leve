import { z } from 'zod';

import { supabase } from '@/lib/supabase/client';

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
  let query = supabase
    .from('messages')
    .select('*')
    .eq('chat_id', z.string().uuid().parse(chatId))
    .order('created_at', { ascending: false })
    .limit(30);
  if (before) query = query.lt('created_at', z.iso.datetime().parse(before));
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function sendMessage(input: z.input<typeof messageSchema>, senderId: string) {
  const payload = messageSchema.parse(input);
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...payload, sender_id: z.string().uuid().parse(senderId) })
    .select()
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

export function subscribeToMessages(chatId: string, onMessage: () => void) {
  return supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      onMessage,
    )
    .subscribe();
}
