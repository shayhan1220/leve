import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfilePhoto } from '@/components/profile-photo';
import {
  useDateProposals,
  useMarkChatRead,
  useMessageImage,
  useMessages,
  useRespondToDateProposal,
  useSendImage,
  useSendMessage,
} from '@/features/chat/hooks';
import { useAuthStore } from '@/features/auth/store';
import { useMatches } from '@/features/discovery/hooks';
import { hasPlan, usePlan } from '@/features/subscription/use-plan';
import type { Database } from '@/lib/supabase/database.types';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type Message = Database['public']['Tables']['messages']['Row'];
type DateProposal = Database['public']['Tables']['date_proposals']['Row'];
type TimelineItem =
  | { kind: 'message'; id: string; createdAt: string; value: Message }
  | { kind: 'proposal'; id: string; createdAt: string; value: DateProposal };

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((state) => state.session?.user.id);
  const matches = useMatches();
  const plan = usePlan();
  const messages = useMessages(id);
  const proposals = useDateProposals(id);
  const send = useSendMessage();
  const sendImage = useSendImage();
  const markRead = useMarkChatRead(id);
  const markAsRead = markRead.mutate;
  const [body, setBody] = useState('');
  const match = matches.data?.find((item) => item.chat_id === id);
  const canSeeReadReceipts = hasPlan(plan.data, 'plus');
  const messageRows = useMemo(() => messages.data?.pages.flat() ?? [], [messages.data?.pages]);
  const latestIncomingId = messageRows.find((message) => message.sender_id !== userId)?.id;

  useEffect(() => {
    if (id && latestIncomingId) markAsRead();
  }, [id, latestIncomingId, markAsRead]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const rows: TimelineItem[] = [
      ...messageRows.map(
        (message): TimelineItem => ({
          kind: 'message',
          id: message.id,
          createdAt: message.created_at,
          value: message,
        }),
      ),
      ...(proposals.data ?? []).map(
        (proposal): TimelineItem => ({
          kind: 'proposal',
          id: proposal.id,
          createdAt: proposal.created_at,
          value: proposal,
        }),
      ),
    ];
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [messageRows, proposals.data]);

  async function submit() {
    const trimmed = body.trim();
    if (!id || !userId || !trimmed || send.isPending) return;
    try {
      await send.mutateAsync({ chatId: id, senderId: userId, body: trimmed });
      setBody('');
    } catch (error) {
      showSendError(error);
    }
  }

  async function pickImage() {
    if (!id || !userId || sendImage.isPending) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한이 필요해요', '대화에 사진을 보내려면 접근을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.86,
      selectionLimit: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    if ((result.assets[0].fileSize ?? 0) > 10 * 1024 * 1024) {
      Alert.alert('사진 용량이 너무 커요', '10MB 이하 이미지를 선택해 주세요.');
      return;
    }
    try {
      await sendImage.mutateAsync({
        chatId: id,
        senderId: userId,
        image: {
          uri: result.assets[0].uri,
          mimeType: result.assets[0].mimeType ?? null,
        },
      });
    } catch (error) {
      showSendError(error);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <ProfilePhoto
            label={match?.nickname ?? null}
            path={match?.photo_path}
            style={styles.avatar}
          />
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.name}>
              {match?.nickname ?? '새로운 인연'}
            </Text>
            <Text style={styles.compatibility}>{match?.region ?? 'Léve'} · 안전하게 대화 중</Text>
          </View>
          <Pressable accessibilityLabel="대화 메뉴" style={styles.more}>
            <Text style={styles.moreText}>⋯</Text>
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.messages}
          data={timeline}
          inverted
          keyExtractor={(item) => `${item.kind}:${item.id}`}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <View style={styles.matchNotice}>
              <Text style={styles.matchNoticeText}>
                오늘 매칭됐어요 · 먼저 따뜻한 인사를 나눠보세요
              </Text>
            </View>
          }
          onEndReached={() => {
            if (messages.hasNextPage && !messages.isFetchingNextPage) {
              void messages.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.35}
          renderItem={({ item }) =>
            item.kind === 'message' ? (
              <MessageBubble
                canSeeReadReceipts={canSeeReadReceipts}
                currentUserId={userId}
                message={item.value}
              />
            ) : (
              <DateProposalCard currentUserId={userId} proposal={item.value} />
            )
          }
          style={styles.list}
        />

        <View style={styles.composer}>
          <Pressable
            accessibilityLabel="데이트 제안"
            onPress={() =>
              id
                ? router.push({
                    pathname: '/date-proposal',
                    params: { chatId: id, name: match?.nickname },
                  })
                : undefined
            }
            style={styles.proposalButton}
          >
            <Text style={styles.proposalIcon}>▣</Text>
          </Pressable>
          <View style={styles.inputWrap}>
            <TextInput
              accessibilityLabel="메시지 입력"
              maxLength={4000}
              multiline
              onChangeText={setBody}
              placeholder="메시지 입력"
              placeholderTextColor="#8B8994"
              style={styles.input}
              value={body}
            />
            <Pressable
              accessibilityLabel="사진 보내기"
              onPress={pickImage}
              style={styles.photoButton}
            >
              <Text style={styles.photoIcon}>＋</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel="메시지 보내기"
            disabled={!body.trim() || send.isPending}
            onPress={submit}
            style={[styles.sendButton, (!body.trim() || send.isPending) && styles.sendDisabled]}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  currentUserId,
  canSeeReadReceipts,
}: {
  message: Message;
  currentUserId: string | undefined;
  canSeeReadReceipts: boolean;
}) {
  const mine = message.sender_id === currentUserId;
  const image = useMessageImage(message.type === 'image' ? message.storage_path : null);
  return (
    <View style={[styles.messageRow, mine && styles.messageRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        {message.type === 'image' ? (
          image.data ? (
            <Image contentFit="cover" source={image.data} style={styles.messageImage} />
          ) : (
            <View style={styles.imageLoading}>
              <Text style={styles.imageLoadingText}>사진 불러오는 중</Text>
            </View>
          )
        ) : (
          <Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.body}</Text>
        )}
      </View>
      {mine && canSeeReadReceipts && message.read_at ? <Text style={styles.read}>읽음</Text> : null}
    </View>
  );
}

function DateProposalCard({
  proposal,
  currentUserId,
}: {
  proposal: DateProposal;
  currentUserId: string | undefined;
}) {
  const response = useRespondToDateProposal(proposal.chat_id);
  const mine = proposal.proposer_id === currentUserId;
  const status =
    proposal.status === 'accepted'
      ? '수락됨'
      : proposal.status === 'declined'
        ? '거절됨'
        : mine
          ? '답변을 기다리고 있어요'
          : '데이트 제안이 도착했어요';

  return (
    <View style={[styles.proposalCard, mine && styles.proposalCardMine]}>
      <Text style={styles.proposalEyebrow}>DATE PROPOSAL</Text>
      <Text style={styles.proposalTitle}>{proposal.place}</Text>
      <Text style={styles.proposalDate}>{formatDateTime(proposal.datetime)}</Text>
      <Text style={styles.proposalStatus}>{status}</Text>
      {!mine && proposal.status === 'proposed' ? (
        <View style={styles.proposalActions}>
          <Pressable
            onPress={() => response.mutate({ proposalId: proposal.id, status: 'declined' })}
            style={styles.decline}
          >
            <Text style={styles.declineText}>이번엔 어려워요</Text>
          </Pressable>
          <Pressable
            onPress={() => response.mutate({ proposalId: proposal.id, status: 'accepted' })}
            style={styles.accept}
          >
            <Text style={styles.acceptText}>좋아요</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function showSendError(error: unknown) {
  const message = error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.';
  Alert.alert(
    message.includes('CHAT_FORBIDDEN') ? '대화를 계속할 수 없어요' : '메시지를 보내지 못했어요',
    message.includes('CHAT_FORBIDDEN')
      ? '차단 상태이거나 더 이상 접근할 수 없는 대화예요.'
      : message,
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  keyboard: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDF5',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  back: { width: 36, height: 44, justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 30 },
  avatar: { width: 40, height: 40, borderRadius: radius.pill },
  headerCopy: { flex: 1, marginLeft: 12 },
  name: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  compatibility: {
    marginTop: 1,
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 12,
    fontWeight: '500',
  },
  more: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  moreText: { color: colors.ink2, fontSize: 24, fontWeight: '700' },
  list: { flex: 1 },
  messages: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 18, gap: 8 },
  matchNotice: { alignItems: 'center', marginBottom: 18 },
  matchNoticeText: {
    borderRadius: radius.pill,
    backgroundColor: '#EBEBF2',
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  messageRow: { alignItems: 'flex-start', marginVertical: 4 },
  messageRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', overflow: 'hidden', paddingHorizontal: 15, paddingVertical: 11 },
  bubbleOther: {
    borderWidth: 1,
    borderColor: '#EDEDF5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.surface,
  },
  bubbleMine: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 20,
    backgroundColor: colors.accent,
  },
  messageText: { color: colors.ink, fontFamily: typography.ko, fontSize: 15, lineHeight: 21 },
  messageTextMine: { color: colors.surface },
  messageImage: { width: 210, height: 250, borderRadius: 14 },
  imageLoading: { width: 210, height: 180, alignItems: 'center', justifyContent: 'center' },
  imageLoadingText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  read: { marginTop: 3, color: colors.ink2, fontFamily: typography.ko, fontSize: 10 },
  proposalCard: {
    width: '82%',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DED9EF',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    marginVertical: 6,
    padding: spacing.md,
  },
  proposalCardMine: { alignSelf: 'flex-end' },
  proposalEyebrow: {
    color: colors.accent,
    fontFamily: typography.display,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  proposalTitle: {
    marginTop: 8,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '700',
  },
  proposalDate: { marginTop: 5, color: colors.ink2, fontFamily: typography.ko, fontSize: 13 },
  proposalStatus: {
    marginTop: 10,
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 12,
    fontWeight: '600',
  },
  proposalActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  decline: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.field,
  },
  declineText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  accept: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: colors.accent,
  },
  acceptText: { color: colors.surface, fontFamily: typography.ko, fontSize: 12, fontWeight: '700' },
  composer: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDEDF5',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  proposalButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: '#F1EEFA',
  },
  proposalIcon: { color: colors.accent, fontSize: 20 },
  inputWrap: {
    minHeight: 46,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 23,
    backgroundColor: '#F2F2F7',
    paddingLeft: 18,
  },
  input: {
    maxHeight: 100,
    flex: 1,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    lineHeight: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  photoButton: { width: 42, height: 46, alignItems: 'center', justifyContent: 'center' },
  photoIcon: { color: colors.ink2, fontSize: 22 },
  sendButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  sendDisabled: { opacity: 0.4 },
  sendIcon: { color: colors.surface, fontSize: 26, lineHeight: 28 },
});
