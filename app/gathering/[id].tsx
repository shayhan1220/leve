import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useApplyGathering, useGatheringDetail } from '@/features/community/hooks';
import { formatCommunityDate } from '@/features/community/presentation';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function GatheringDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useGatheringDetail(id);
  const apply = useApplyGathering();
  const gathering = detail.data;

  async function submit() {
    if (!id) return;
    try {
      await apply.mutateAsync(id);
      router.replace('/gathering-applied');
    } catch (error) {
      const message = error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.';
      Alert.alert('신청하지 못했어요', message);
    }
  }

  return (
    <Screen scroll style={styles.screen}>
      <AppHeader title="모임 상세" />
      {detail.isLoading || !gathering ? (
        <Text style={styles.state}>모임 정보를 불러오고 있어요.</Text>
      ) : (
        <>
          <View style={[styles.hero, gathering.is_queer && styles.heroQueer]}>
            <Text style={styles.heroTag}>{gathering.type === 'flash' ? '플래시' : '밋업'}</Text>
            <Text style={styles.heroTitle}>{gathering.title}</Text>
            <Text style={styles.heroMeta}>
              {formatCommunityDate(gathering.start_at)} · {gathering.region}
            </Text>
          </View>
          <View style={styles.stats}>
            <Stat
              label="참여 확정"
              value={`${gathering.confirmed_count}/${gathering.capacity}명`}
            />
            <Stat label="카테고리" value={gathering.category} />
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>모임 소개</Text>
            <Text style={styles.description}>{gathering.description}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>호스트</Text>
            <Text style={styles.host}>{gathering.host_nickname ?? 'Léve 멤버'}</Text>
            <Text style={styles.hostMeta}>{gathering.host_region ?? gathering.region}</Text>
          </View>
          {gathering.is_host ? (
            <Button
              label="모임 관리하기"
              onPress={() => router.push(`/host/gathering/${gathering.id}`)}
            />
          ) : gathering.my_status ? (
            <View style={styles.applied}>
              <Text style={styles.appliedTitle}>
                {gathering.my_status === 'confirmed'
                  ? '참여가 확정됐어요'
                  : '신청 상태를 확인 중이에요'}
              </Text>
              <Pressable onPress={() => router.push('/my/applications')}>
                <Text style={styles.link}>내 신청 현황 보기</Text>
              </Pressable>
            </View>
          ) : (
            <Button
              disabled={apply.isPending || gathering.status !== 'open'}
              label={apply.isPending ? '신청 중...' : '참여 신청하기'}
              onPress={submit}
            />
          )}
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0, gap: spacing.md },
  state: { color: colors.ink2, fontFamily: typography.ko, textAlign: 'center', paddingTop: 80 },
  hero: {
    minHeight: 230,
    justifyContent: 'flex-end',
    borderRadius: 28,
    backgroundColor: '#8F83C8',
    padding: 24,
    ...shadow.button,
  },
  heroQueer: { backgroundColor: colors.rose },
  heroTag: { color: colors.surface, fontFamily: typography.ko, fontSize: 13, opacity: 0.9 },
  heroTitle: {
    color: colors.surface,
    fontFamily: typography.ko,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 35,
    marginTop: 8,
  },
  heroMeta: { color: colors.surface, fontFamily: typography.ko, fontSize: 14, marginTop: 12 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadow.card,
  },
  statLabel: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  statValue: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
  },
  card: { borderRadius: radius.card, backgroundColor: colors.surface, padding: 20, ...shadow.card },
  sectionTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  description: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
  },
  host: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  hostMeta: { color: colors.ink2, fontFamily: typography.ko, fontSize: 13, marginTop: 4 },
  applied: {
    alignItems: 'center',
    borderRadius: radius.field,
    backgroundColor: '#EFECFA',
    padding: 18,
  },
  appliedTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 15, fontWeight: '700' },
  link: { color: colors.accent, fontFamily: typography.ko, fontSize: 13, marginTop: 8 },
});
