import type { ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '@/theme/tokens';

export function Title(props: ComponentProps<typeof Text>) {
  return <Text accessibilityRole="header" {...props} style={[styles.title, props.style]} />;
}

export function Body(props: ComponentProps<typeof Text>) {
  return <Text {...props} style={[styles.body, props.style]} />;
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 40,
  },
  body: { color: colors.ink2, fontFamily: typography.ko, fontSize: 16, lineHeight: 25 },
});
