import { useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useEvent, useJoinEvent } from '@/features/community/hooks';
import { formatCommunityDate } from '@/features/community/presentation';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  const join = useJoinEvent();

  async function submit() {
    if (!id) return;
    try {
      await join.mutateAsync(id);
      Alert.alert('참여 신청이 완료됐어요', '이벤트 알림에서 최신 소식을 확인할 수 있어요.');
    } catch (error) {
      Alert.alert(
        '신청하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <Screen scroll style={styles.screen}>
      <AppHeader title="이벤트 상세" />
      {event.data ? (
        <>
          <View style={styles.hero}>
            <Text style={styles.partner}>제휴 이벤트 · LEZ ROAD</Text>
            <Text style={styles.title}>{event.data.title}</Text>
            <Text style={styles.meta}>{formatCommunityDate(event.data.start_at)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>이벤트 소개</Text>
            <Text style={styles.body}>{event.data.description}</Text>
          </View>
          {event.data.qr_enabled ? (
            <View style={styles.qr}>
              <Text style={styles.qrMark}>▦</Text>
              <Text style={styles.qrTitle}>QR 입장 지원</Text>
              <Text style={styles.qrBody}>현장에서 Léve 앱의 참가 정보를 확인해 주세요.</Text>
            </View>
          ) : null}
          <Button
            disabled={join.isPending}
            label={join.isPending ? '신청 중...' : '참여 신청하기'}
            onPress={submit}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0, gap: spacing.md },
  hero: {
    minHeight: 260,
    justifyContent: 'flex-end',
    borderRadius: 28,
    backgroundColor: '#A76CA4',
    padding: 24,
    ...shadow.button,
  },
  partner: { color: colors.surface, fontFamily: typography.ko, fontSize: 12 },
  title: {
    color: colors.surface,
    fontFamily: typography.ko,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 10,
  },
  meta: { color: colors.surface, fontFamily: typography.ko, fontSize: 14, marginTop: 12 },
  card: { borderRadius: radius.card, backgroundColor: colors.surface, padding: 20, ...shadow.card },
  sectionTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  body: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
  },
  qr: { alignItems: 'center', borderRadius: radius.card, backgroundColor: '#F0ECFA', padding: 22 },
  qrMark: { color: colors.accent, fontSize: 46 },
  qrTitle: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  qrBody: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});
