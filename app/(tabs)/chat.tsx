import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfilePhoto } from '@/components/profile-photo';
import { Screen } from '@/components/ui/screen';
import { useMatches } from '@/features/discovery/hooks';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ChatListScreen() {
  const matches = useMatches();
  const conversations = matches.data?.filter((match) => match.last_message_at) ?? [];

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>
          대화
        </Text>
      </View>
      {matches.isLoading ? (
        <Text style={styles.state}>대화를 불러오고 있어요.</Text>
      ) : conversations.length ? (
        conversations.map((conversation) => (
          <Pressable
            key={conversation.chat_id}
            onPress={() =>
              router.push({ pathname: '/chat/[id]', params: { id: conversation.chat_id } })
            }
            style={styles.row}
          >
            <ProfilePhoto
              label={conversation.nickname}
              path={conversation.photo_path}
              style={styles.avatar}
            />
            <View style={styles.copy}>
              <Text style={styles.name}>{conversation.nickname ?? '새로운 인연'}</Text>
              <Text numberOfLines={1} style={styles.preview}>
                {conversation.last_message ?? '사진을 보냈어요.'}
              </Text>
            </View>
            {conversation.unread_count ? (
              <View style={styles.unread}>
                <Text style={styles.unreadText}>{Math.min(conversation.unread_count, 99)}</Text>
              </View>
            ) : (
              <Text style={styles.chevron}>›</Text>
            )}
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyMark}>♡</Text>
          <Text style={styles.emptyTitle}>아직 시작된 대화가 없어요</Text>
          <Text style={styles.emptyBody}>매칭된 인연에게 먼저 인사를 건네보세요.</Text>
          <Pressable onPress={() => router.push('/(tabs)/matches')} style={styles.action}>
            <Text style={styles.actionText}>매칭 확인하기</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 20 },
  header: { minHeight: 62, justifyContent: 'center', paddingHorizontal: 4 },
  heading: { color: colors.ink, fontFamily: typography.ko, fontSize: 22, fontWeight: '700' },
  state: { color: colors.ink2, fontFamily: typography.ko, fontSize: 14 },
  row: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 10,
  },
  avatar: { width: 56, height: 56, borderRadius: radius.pill },
  copy: { flex: 1, marginLeft: 14 },
  name: { color: colors.ink, fontFamily: typography.ko, fontSize: 15, fontWeight: '700' },
  preview: { marginTop: 5, color: colors.ink2, fontFamily: typography.ko, fontSize: 13 },
  unread: {
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
  },
  unreadText: { color: colors.surface, fontFamily: typography.ko, fontSize: 11, fontWeight: '700' },
  chevron: { color: colors.ink2, fontSize: 26 },
  empty: { alignItems: 'center', paddingTop: 150 },
  emptyMark: { color: colors.accent, fontSize: 52 },
  emptyTitle: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 19,
    fontWeight: '700',
  },
  emptyBody: { marginTop: spacing.sm, color: colors.ink2, fontFamily: typography.ko, fontSize: 13 },
  action: { minHeight: 44, justifyContent: 'center', marginTop: spacing.md },
  actionText: { color: colors.accent, fontFamily: typography.ko, fontWeight: '700' },
});
