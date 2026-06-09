import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

export function AppHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="뒤로"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.back()}
        style={styles.side}
      >
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Pressable
        accessibilityRole={actionLabel ? 'button' : undefined}
        disabled={!actionLabel}
        onPress={onAction}
        style={[styles.side, styles.action]}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: colors.surface,
    marginHorizontal: -24,
    paddingHorizontal: 16,
  },
  side: { width: 72, minHeight: 44, justifyContent: 'center' },
  action: { alignItems: 'flex-end' },
  back: { color: colors.ink, fontSize: 34, lineHeight: 38 },
  title: {
    flex: 1,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionText: {
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
  },
});
