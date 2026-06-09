import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>대화</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>매칭이 시작됐어요</Text>
        <Text style={styles.emptyBody}>
          채팅방 {id?.slice(0, 8)}의 실시간 메시지는 다음 단계에서 연결됩니다.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 20 },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 32 },
  title: { color: colors.ink, fontFamily: typography.ko, fontSize: 18, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 20, fontWeight: '700' },
  emptyBody: {
    marginTop: spacing.sm,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    textAlign: 'center',
  },
});
