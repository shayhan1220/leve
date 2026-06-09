import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfilePhoto } from '@/components/profile-photo';
import { Screen } from '@/components/ui/screen';
import { useMatches, useWhoLikedMe } from '@/features/discovery/hooks';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function MatchesScreen() {
  const matches = useMatches();
  const likedMe = useWhoLikedMe();

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>
          매칭·대화
        </Text>
      </View>

      <Pressable onPress={() => router.push('/liked-me')} style={styles.likedCard}>
        <View style={styles.likedIcon}>
          <Text style={styles.likedIconText}>♥</Text>
        </View>
        <View>
          <Text style={styles.likedTitle}>나를 좋아한 사람</Text>
          <Text style={styles.likedCount}>
            {likedMe.data?.count ?? 0}명이 새로운 인연을 기다리고 있어요
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.section}>최근 매칭</Text>
      {matches.isLoading ? (
        <Text style={styles.state}>매칭을 불러오고 있어요.</Text>
      ) : matches.data?.length ? (
        <View>
          {matches.data.map((match) => (
            <Pressable
              key={match.match_id}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: match.chat_id } })}
              style={styles.match}
            >
              <ProfilePhoto label={match.nickname} path={match.photo_path} style={styles.avatar} />
              <View style={styles.matchCopy}>
                <Text style={styles.name}>
                  {match.nickname ?? '새로운 인연'}
                  {match.age ? `, ${match.age}` : ''}
                </Text>
                <Text numberOfLines={1} style={styles.preview}>
                  {match.last_message || '먼저 따뜻한 인사를 건네보세요.'}
                </Text>
              </View>
              {match.unread_count > 0 ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{Math.min(match.unread_count, 99)}</Text>
                </View>
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyMark}>♡</Text>
          <Text style={styles.emptyTitle}>아직 새로운 매칭이 없어요</Text>
          <Text style={styles.emptyBody}>탐색에서 마음이 가는 사람에게 좋아요를 보내보세요.</Text>
          <Pressable onPress={() => router.push('/(tabs)/discover')} style={styles.explore}>
            <Text style={styles.exploreText}>탐색하러 가기</Text>
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
  likedCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.card,
    backgroundColor: '#EFECF8',
    paddingHorizontal: spacing.md,
  },
  likedIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  likedIconText: { color: colors.surface, fontSize: 20 },
  likedTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 15, fontWeight: '700' },
  likedCount: { marginTop: 3, color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  chevron: { color: colors.ink2, fontSize: 26, marginLeft: 'auto' },
  section: {
    marginTop: spacing.xl,
    marginBottom: 8,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '700',
  },
  state: { color: colors.ink2, fontFamily: typography.ko, fontSize: 14 },
  match: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 10,
  },
  avatar: { width: 56, height: 56, borderRadius: radius.pill },
  matchCopy: { flex: 1, marginLeft: 14 },
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
  empty: { alignItems: 'center', paddingTop: 110 },
  emptyMark: { color: colors.accent, fontSize: 54 },
  emptyTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 19, fontWeight: '700' },
  emptyBody: {
    marginTop: spacing.sm,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  explore: { minHeight: 44, justifyContent: 'center', marginTop: spacing.md },
  exploreText: { color: colors.accent, fontFamily: typography.ko, fontWeight: '700' },
});
