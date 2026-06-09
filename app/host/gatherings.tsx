import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GatheringCard } from '@/components/community/gathering-card';
import { AppHeader } from '@/components/ui/app-header';
import { Screen } from '@/components/ui/screen';
import { useGatheringQuota, useHostedGatherings } from '@/features/community/hooks';
import { usePlan } from '@/features/subscription/use-plan';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function HostedGatheringsScreen() {
  const hosted = useHostedGatherings();
  const plan = usePlan();
  const quota = useGatheringQuota(plan.data === 'premium');
  const remaining = Math.max((quota.data?.limit ?? 3) - (quota.data?.used ?? 0), 0);

  return (
    <Screen scroll style={styles.screen}>
      <AppHeader title="내가 만든 모임" />
      {plan.data === 'premium' ? (
        <View style={styles.quota}>
          <Text style={styles.quotaText}>이번 주 {remaining}개 더 만들 수 있어요</Text>
          <View style={styles.dots}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[styles.dot, index >= (quota.data?.used ?? 0) && styles.dotMuted]}
              />
            ))}
          </View>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.push(plan.data === 'premium' ? '/gathering/create' : '/gathering/apply')
        }
        style={styles.create}
      >
        <Text style={styles.createText}>+ 새 모임 만들기</Text>
      </Pressable>
      <View style={styles.list}>
        {hosted.data?.map((gathering) => (
          <GatheringCard
            key={gathering.id}
            compact
            gathering={gathering}
            onPress={() => router.push(`/host/gathering/${gathering.id}`)}
          />
        ))}
        {!hosted.isLoading && !hosted.data?.length ? (
          <Text style={styles.empty}>아직 만든 모임이 없어요.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0, gap: spacing.md },
  quota: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F4EFE6',
    paddingHorizontal: 16,
  },
  quotaText: {
    flex: 1,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '500',
  },
  dots: { flexDirection: 'row', gap: 7 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  dotMuted: { backgroundColor: '#E3D8C0' },
  create: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: '#ECE9F8',
  },
  createText: { color: colors.accent, fontFamily: typography.ko, fontSize: 15, fontWeight: '700' },
  list: { gap: 12, paddingBottom: spacing.xl },
  empty: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 50,
  },
});
