import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { colors, spacing, typography } from '@/theme/tokens';

export default function NotificationsScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>알림</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>새로운 알림이 없어요</Text>
        <Text style={styles.emptyBody}>매칭과 메시지 소식을 이곳에서 알려드릴게요.</Text>
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
  emptyTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 19, fontWeight: '700' },
  emptyBody: { marginTop: spacing.sm, color: colors.ink2, fontFamily: typography.ko, fontSize: 13 },
});
