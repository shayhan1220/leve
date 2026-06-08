import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type Props = ComponentProps<typeof TextInput> & {
  label: string;
  trailing?: ReactNode;
};

export function FormField({ label, trailing, style, editable = true, ...props }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !editable && styles.readOnly]}>
        <TextInput
          editable={editable}
          placeholderTextColor="#AAA8B2"
          style={[styles.input, style]}
          {...props}
        />
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  readOnly: { backgroundColor: '#F0F0F5' },
  input: {
    minHeight: 56,
    flex: 1,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 16,
  },
});
