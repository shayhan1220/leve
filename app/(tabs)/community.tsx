import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GatheringCard } from '@/components/community/gathering-card';
import { Screen } from '@/components/ui/screen';
import { useCommunityFeed } from '@/features/community/hooks';
import { colors, radius, shadow, typography } from '@/theme/tokens';

type Filter = 'all' | 'meetup' | 'flash' | 'groups';

export default function CommunityScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const feed = useCommunityFeed(filter === 'meetup' || filter === 'flash' ? filter : undefined);
  const gatherings = feed.data?.gatherings ?? [];
  const groups = feed.data?.groups ?? [];
  const featuredEvent = feed.data?.events[0];

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>
          커뮤니티
        </Text>
        <Pressable
          accessibilityLabel="받은 알림"
          accessibilityRole="button"
          onPress={() => router.push('/notifications')}
          style={styles.iconButton}
        >
          <Text style={styles.bell}>♢</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/gathering/apply')}
          style={styles.applyButton}
        >
          <Text style={styles.applyText}>+ 모임 신청</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        {(
          [
            ['all', '전체'],
            ['meetup', '밋업'],
            ['flash', '플래시'],
            ['groups', '그룹'],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === value }}
            onPress={() => setFilter(value)}
            style={[styles.filter, filter === value && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filter !== 'groups' && featuredEvent ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/event/${featuredEvent.id}`)}
            style={styles.hero}
          >
            <Text style={styles.heroEyebrow}>제휴 이벤트 · LEZ ROAD</Text>
            <Text style={styles.heroTitle}>{featuredEvent.title}</Text>
            <Text style={styles.heroMeta}>QR 입장 · 자세히 보기</Text>
          </Pressable>
        ) : null}

        {filter === 'groups' ? (
          <>
            <SectionHeader action={() => router.push('/groups')} title="관심사 그룹" />
            {groups.map((group) => (
              <Pressable
                key={group.id}
                accessibilityRole="button"
                onPress={() => router.push(`/group/${group.id}`)}
                style={styles.groupCard}
              >
                <View style={[styles.groupArt, group.is_queer && styles.groupArtQueer]} />
                <View style={styles.groupCopy}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text numberOfLines={2} style={styles.groupDescription}>
                    {group.description}
                  </Text>
                  <Text style={styles.groupMeta}>
                    멤버 {group.member_count}명{group.is_member ? ' · 가입됨' : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <SectionHeader
              action={() => router.push('/host/gatherings')}
              actionLabel="내 모임"
              title="이번 주 모임"
            />
            {feed.isLoading ? (
              <Text style={styles.state}>모임을 불러오고 있어요.</Text>
            ) : gatherings.length ? (
              gatherings.map((gathering) => (
                <GatheringCard
                  key={gathering.id}
                  gathering={gathering}
                  onPress={() => router.push(`/gathering/${gathering.id}`)}
                />
              ))
            ) : (
              <Text style={styles.state}>현재 모집 중인 모임이 없어요.</Text>
            )}
          </>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/gathering/create')}
          style={styles.premiumBanner}
        >
          <Text style={styles.bannerTitle}>모임을 열고 싶다면 신청해 주세요</Text>
          <Text style={styles.bannerBody}>관리자 검토를 거쳐 안전하게 등록돼요.</Text>
          <Text style={styles.bannerPremium}>✦ Premium은 검토 없이 직접 개설 (주 3회) ›</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function SectionHeader({
  title,
  action,
  actionLabel = '전체보기',
}: {
  title: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
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
  heading: { color: colors.ink, fontFamily: typography.ko, fontSize: 22, fontWeight: '700' },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  bell: { color: colors.ink2, fontSize: 25 },
  applyButton: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: '#EFECFA',
    paddingHorizontal: 12,
  },
  applyText: { color: colors.accent, fontFamily: typography.ko, fontSize: 12, fontWeight: '500' },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingVertical: 12 },
  filter: {
    minHeight: 32,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5ED',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
  },
  filterActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  filterText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  filterTextActive: { color: colors.surface, fontWeight: '700' },
  content: { gap: 10, paddingBottom: 32 },
  hero: {
    minHeight: 128,
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#9A6BA8',
    paddingHorizontal: 20,
    marginBottom: 10,
    ...shadow.button,
  },
  heroEyebrow: { color: colors.surface, fontFamily: typography.ko, fontSize: 12, opacity: 0.9 },
  heroTitle: {
    color: colors.surface,
    fontFamily: typography.ko,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 8,
  },
  heroMeta: { color: colors.surface, fontFamily: typography.ko, fontSize: 13, marginTop: 8 },
  sectionHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  sectionTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  sectionAction: { color: colors.accent, fontFamily: typography.ko, fontSize: 13 },
  state: {
    minHeight: 100,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 38,
  },
  premiumBanner: {
    minHeight: 90,
    borderRadius: 16,
    backgroundColor: '#EDE9FA',
    padding: 16,
    marginTop: 4,
  },
  bannerTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 13, fontWeight: '500' },
  bannerBody: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12, marginTop: 5 },
  bannerPremium: { color: colors.gold, fontFamily: typography.ko, fontSize: 13, marginTop: 8 },
  groupCard: {
    minHeight: 112,
    flexDirection: 'row',
    gap: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadow.card,
  },
  groupArt: { width: 74, height: 74, borderRadius: 20, backgroundColor: '#87BFB3' },
  groupArtQueer: { backgroundColor: '#D4A1BA' },
  groupCopy: { flex: 1, gap: 4 },
  groupName: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  groupDescription: { color: colors.ink2, fontFamily: typography.ko, fontSize: 13, lineHeight: 19 },
  groupMeta: { color: colors.accent, fontFamily: typography.ko, fontSize: 12 },
});
