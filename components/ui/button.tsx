import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

type Props = ComponentProps<typeof Pressable> & { label: string };

export function Button({ label, disabled, style, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    ...shadow.button,
  },
  label: {
    color: colors.surface,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: { opacity: 0.86 },
  disabled: { opacity: 0.45 },
});
