import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type Props = PropsWithChildren<{
  step: 1 | 2 | 3;
  footer?: ReactNode;
  scroll?: boolean;
}>;

export function OnboardingShell({ children, step, footer, scroll = false }: Props) {
  const content = (
    <View style={styles.page}>
      <View pointerEvents="none" style={styles.decorationLarge} />
      <View pointerEvents="none" style={styles.decorationSmall} />

      <View style={styles.header}>
        <Text accessibilityLabel="Léve" style={styles.logo}>
          Léve
        </Text>
        <View accessibilityLabel={`가입 ${step}/3단계`} style={styles.progress}>
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              style={[styles.progressBar, item <= step && styles.progressBarActive]}
            />
          ))}
        </View>
      </View>

      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  keyboard: { flex: 1 },
  page: { width: '100%', maxWidth: 430, flex: 1, alignSelf: 'center', overflow: 'hidden' },
  decorationLarge: {
    position: 'absolute',
    right: -92,
    top: -84,
    width: 230,
    height: 230,
    borderRadius: radius.pill,
    backgroundColor: '#EFECFA',
    opacity: 0.72,
  },
  decorationSmall: {
    position: 'absolute',
    right: 16,
    top: 38,
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: '#E4F3EF',
    opacity: 0.75,
  },
  header: { paddingHorizontal: 28, paddingTop: 18 },
  logo: {
    color: colors.accent,
    fontFamily: typography.display,
    fontSize: 29,
    fontWeight: '600',
    letterSpacing: -1.2,
  },
  progress: { flexDirection: 'row', gap: 8, marginTop: 24 },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: '#E5E3EC',
  },
  progressBarActive: { backgroundColor: colors.accent },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: spacing.lg },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: { paddingHorizontal: 28, paddingBottom: 12, paddingTop: spacing.sm },
});
