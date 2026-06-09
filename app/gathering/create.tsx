import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GatheringForm } from '@/components/community/gathering-form';
import { AppHeader } from '@/components/ui/app-header';
import { Screen } from '@/components/ui/screen';
import { useCreateGathering, useGatheringQuota } from '@/features/community/hooks';
import { usePlan } from '@/features/subscription/use-plan';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function GatheringCreateScreen() {
  const plan = usePlan();
  const quota = useGatheringQuota(plan.data === 'premium');
  const create = useCreateGathering();

  if (!plan.isLoading && plan.data !== 'premium') {
    router.replace('/paywall/premium');
    return null;
  }

  return (
    <Screen scroll style={styles.screen}>
      <AppHeader title="모임 직접 만들기" />
      <View style={styles.quota}>
        <Text style={styles.quotaTitle}>
          이번 주 {Math.max((quota.data?.limit ?? 3) - (quota.data?.used ?? 0), 0)}개 더 만들 수
          있어요
        </Text>
        <Text style={styles.quotaBody}>Premium 모임은 검토 없이 바로 공개돼요.</Text>
      </View>
      <GatheringForm
        pending={create.isPending}
        submitLabel="바로 등록하기"
        onSubmit={async (input) => {
          try {
            const gathering = await create.mutateAsync(input);
            router.replace(`/host/created-done?id=${gathering.id}`);
          } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (message.includes('WEEKLY_LIMIT')) {
              throw new Error('이번 주 직접 개설 한도 3회를 모두 사용했어요.');
            }
            throw error;
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0, gap: spacing.md },
  quota: { borderRadius: radius.field, backgroundColor: '#F4EFE6', padding: 16 },
  quotaTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 14, fontWeight: '700' },
  quotaBody: { color: colors.gold, fontFamily: typography.ko, fontSize: 12, marginTop: 5 },
});
