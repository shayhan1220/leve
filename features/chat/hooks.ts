import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  createDateProposal,
  getDateProposals,
  getMessageImageUrl,
  getMessages,
  markChatRead,
  respondToDateProposal,
  sendMessage,
  subscribeToMessages,
  uploadMessageImage,
} from '@/features/chat/api';
import { supabase } from '@/lib/supabase/client';

export function useMessages(chatId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: ({ pageParam }) => getMessages(chatId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === 30 ? lastPage[lastPage.length - 1]?.created_at : undefined,
    enabled: Boolean(chatId),
  });

  useEffect(() => {
    if (!chatId) return;
    const channel = subscribeToMessages(chatId, () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      void queryClient.invalidateQueries({ queryKey: ['date-proposals', chatId] });
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
    });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);

  return query;
}

export function useDateProposals(chatId: string | undefined) {
  return useQuery({
    queryKey: ['date-proposals', chatId],
    queryFn: () => getDateProposals(chatId!),
    enabled: Boolean(chatId),
  });
}

export function useMarkChatRead(chatId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markChatRead(chatId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, senderId, body }: { chatId: string; senderId: string; body: string }) =>
      sendMessage({ chat_id: chatId, type: 'text', body, storage_path: null }, senderId),
    onSuccess: (message) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', message.chat_id] });
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useSendImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chatId,
      senderId,
      image,
    }: {
      chatId: string;
      senderId: string;
      image: { uri: string; mimeType?: string | null };
    }) => {
      const path = await uploadMessageImage(chatId, image);
      try {
        return await sendMessage(
          { chat_id: chatId, type: 'image', body: null, storage_path: path },
          senderId,
        );
      } catch (error) {
        await supabase.storage.from('message-images').remove([path]);
        throw error;
      }
    },
    onSuccess: (message) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', message.chat_id] });
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useMessageImage(path: string | null) {
  return useQuery({
    queryKey: ['message-image', path],
    queryFn: () => getMessageImageUrl(path!),
    enabled: Boolean(path),
    staleTime: 12 * 60 * 1000,
  });
}

export function useCreateDateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDateProposal,
    onSuccess: (proposal) => {
      void queryClient.invalidateQueries({ queryKey: ['date-proposals', proposal.chat_id] });
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useRespondToDateProposal(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, status }: { proposalId: string; status: 'accepted' | 'declined' }) =>
      respondToDateProposal(proposalId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['date-proposals', chatId] });
    },
  });
}
