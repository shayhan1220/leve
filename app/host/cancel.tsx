import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCancelGathering } from '@/features/community/hooks';
import { colors, radius, shadow, typography } from '@/theme/tokens';

export default function CancelGatheringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cancel = useCancelGathering();

  async function confirm() {
    if (!id) return;
    try {
      await cancel.mutateAsync(id);
      router.dismissAll();
      router.replace('/host/gatherings');
    } catch (error) {
      Alert.alert(
        '취소하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <Pressable onPress={() => router.back()} style={styles.overlay}>
      <Pressable accessibilityRole="none" onPress={() => undefined} style={styles.dialog}>
        <View style={styles.mark}>
          <Text style={styles.warning}>△</Text>
        </View>
        <Text style={styles.title}>모임을 취소할까요?</Text>
        <Text style={styles.body}>
          신청·확정한 멤버에게 취소 알림이 가요.{'\n'}이 작업은 되돌릴 수 없어요.
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={() => router.back()} style={styles.close}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
          <Pressable disabled={cancel.isPending} onPress={confirm} style={styles.confirm}>
            <Text style={styles.confirmText}>{cancel.isPending ? '취소 중...' : '모임 취소'}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,26,36,0.94)',
    padding: 40,
  },
  dialog: {
    width: '100%',
    maxWidth: 310,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 24,
    ...shadow.card,
  },
  mark: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 28,
    backgroundColor: '#FBEAEC',
  },
  warning: { color: '#D94D5C', fontSize: 27, fontWeight: '700' },
  title: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  body: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  close: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: '#F2F2F7',
  },
  closeText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 15, fontWeight: '700' },
  confirm: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: '#D94D5C',
  },
  confirmText: {
    color: colors.surface,
    fontFamily: typography.ko,
    fontSize: 15,
    fontWeight: '700',
  },
});
