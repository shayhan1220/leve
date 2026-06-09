import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfilePhoto } from '@/components/profile-photo';
import { Screen } from '@/components/ui/screen';
import { useDiscoveryFilterStore } from '@/features/discovery/filter-store';
import { useDiscoverFeed, useReactToProfile } from '@/features/discovery/hooks';
import { clanPresentation } from '@/features/lovedna/presentation';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function DiscoverScreen() {
  const filters = useDiscoveryFilterStore((state) => state.filters);
  const feed = useDiscoverFeed(filters);
  const reaction = useReactToProfile();
  const [index, setIndex] = useState(0);
  const profile = feed.data?.[index];

  async function react(type: 'like' | 'super' | 'pass') {
    if (!profile) return;
    try {
      const result = await reaction.mutateAsync({ userId: profile.user_id, type });
      if (result.matched && result.chat_id) {
        router.push({
          pathname: '/match-made',
          params: {
            chatId: result.chat_id,
            name: profile.nickname ?? '새로운 인연',
            compatibility: String(profile.compatibility),
          },
        });
        return;
      }
      setIndex((current) => current + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.';
      if (message.includes('PLAN_REQUIRED')) {
        Alert.alert('Léve Plus 기능이에요', '슈퍼라이크는 Plus 이상에서 사용할 수 있어요.');
      } else if (message.includes('DAILY_LIMIT')) {
        Alert.alert('오늘의 좋아요를 모두 사용했어요', '내일 다시 새로운 인연을 만나보세요.');
      } else if (message.includes('SUPER_LIMIT')) {
        Alert.alert('오늘의 슈퍼라이크를 모두 사용했어요');
      } else {
        Alert.alert('반응을 보내지 못했어요', message);
      }
    }
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>
          탐색
        </Text>
        <Pressable
          accessibilityLabel="받은 알림"
          accessibilityRole="button"
          onPress={() => router.push('/notifications')}
          style={styles.headerButton}
        >
          <Text style={styles.bell}>♢</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/filter')}
          style={styles.filterButton}
        >
          <Text style={styles.filterText}>필터</Text>
        </Pressable>
      </View>

      {feed.isLoading ? (
        <DiscoveryLoading />
      ) : profile ? (
        <>
          <Pressable
            accessibilityLabel={`${profile.nickname ?? '프로필'} 상세 보기`}
            accessibilityRole="button"
            onPress={() => router.push(`/profile/${profile.user_id}`)}
            style={styles.card}
          >
            <View style={styles.photoArea}>
              <ProfilePhoto
                label={profile.nickname}
                path={profile.photo_path}
                style={styles.photo}
              />
              <View style={styles.photoShade} />
              <View style={styles.compatibility}>
                <Text style={styles.compatibilityText}>적합도 {profile.compatibility}%</Text>
              </View>
              <View style={styles.identity}>
                <Text style={styles.name}>
                  {profile.nickname ?? '이름 비공개'}
                  {profile.age ? `, ${profile.age}` : ''}
                </Text>
                <Text style={styles.region}>{profile.region ?? '지역 비공개'}</Text>
              </View>
            </View>

            <View style={styles.details}>
              <View style={styles.tags}>
                {profile.looking_for.slice(0, 3).map((tag, tagIndex) => (
                  <View key={tag} style={[styles.tag, tagIndex > 0 && styles.tagMuted]}>
                    <Text style={[styles.tagText, tagIndex > 0 && styles.tagTextMuted]}>{tag}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.clan}>
                {profile.love_dna_clan
                  ? `${profile.love_dna_clan} · ${clanPresentation[profile.love_dna_clan].korean} · ${clanPresentation[profile.love_dna_clan].tagline}`
                  : 'Love DNA를 알아가는 중'}
              </Text>
              <Text numberOfLines={2} style={styles.bio}>
                {profile.bio || '천천히 서로를 알아가고 싶어요.'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.actions}>
            <ReactionButton
              accessibilityLabel="관심 없음"
              label="×"
              onPress={() => react('pass')}
            />
            <ReactionButton
              primary
              accessibilityLabel="좋아요"
              label="♥"
              onPress={() => react('like')}
            />
            <ReactionButton
              accessibilityLabel="슈퍼라이크"
              label="★"
              onPress={() => react('super')}
            />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyMark}>◇</Text>
          <Text style={styles.emptyTitle}>새로운 인연을 찾고 있어요</Text>
          <Text style={styles.emptyBody}>필터를 넓히거나 잠시 후 다시 확인해 주세요.</Text>
          <Pressable onPress={() => feed.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>다시 확인하기</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

function ReactionButton({
  label,
  primary = false,
  ...props
}: {
  label: string;
  primary?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable {...props} style={[styles.action, primary && styles.actionPrimary]}>
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function DiscoveryLoading() {
  return (
    <View style={[styles.card, styles.loadingCard]}>
      <View style={styles.loadingPhoto} />
      <View style={styles.loadingLine} />
      <View style={[styles.loadingLine, styles.loadingLineShort]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  heading: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 22,
    fontWeight: '700',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  bell: { color: colors.ink2, fontSize: 26 },
  filterButton: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  filterText: { color: colors.accent, fontFamily: typography.ko, fontSize: 15, fontWeight: '500' },
  card: {
    height: 560,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDEDF5',
    borderRadius: 28,
    backgroundColor: colors.surface,
    marginTop: 8,
    ...shadow.card,
  },
  photoArea: { height: 380, overflow: 'hidden', backgroundColor: '#C7BDDF' },
  photo: { width: '100%', height: '100%' },
  photoShade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 165,
    backgroundColor: 'rgba(20, 22, 35, 0.34)',
  },
  compatibility: {
    position: 'absolute',
    right: 16,
    top: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compatibilityText: {
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 12,
    fontWeight: '500',
  },
  identity: { position: 'absolute', right: 16, bottom: 16, left: 16 },
  name: { color: colors.surface, fontFamily: typography.ko, fontSize: 24, fontWeight: '700' },
  region: {
    marginTop: 2,
    color: '#F2F2F7',
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '500',
  },
  details: { flex: 1, padding: spacing.md },
  tags: { flexDirection: 'row', gap: 8 },
  tag: {
    borderRadius: radius.pill,
    backgroundColor: '#EFECF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagMuted: { backgroundColor: '#F0F0F5' },
  tagText: { color: colors.accent, fontFamily: typography.ko, fontSize: 12, fontWeight: '500' },
  tagTextMuted: { color: colors.ink2 },
  clan: {
    marginTop: 12,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
  },
  bio: { marginTop: 8, color: colors.ink, fontFamily: typography.ko, fontSize: 14, lineHeight: 21 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 22,
  },
  action: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  actionPrimary: { width: 66, height: 66, backgroundColor: colors.accent, ...shadow.button },
  actionText: { color: '#8C8FA1', fontSize: 30, lineHeight: 34 },
  actionTextPrimary: { color: colors.surface, fontSize: 28 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyMark: { color: colors.accent, fontSize: 58 },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyBody: {
    marginTop: spacing.sm,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    textAlign: 'center',
  },
  retry: { minHeight: 44, justifyContent: 'center', marginTop: spacing.md },
  retryText: { color: colors.accent, fontFamily: typography.ko, fontWeight: '700' },
  loadingCard: { padding: spacing.md },
  loadingPhoto: { height: 340, borderRadius: radius.card, backgroundColor: '#E9E7F0' },
  loadingLine: { height: 18, borderRadius: 9, backgroundColor: '#E9E7F0', marginTop: 24 },
  loadingLineShort: { width: '64%', marginTop: 12 },
});
