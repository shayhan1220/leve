import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { Body, Title } from '@/components/ui/typography';
import { useAuthStore } from '@/features/auth/store';
import { useVerification } from '@/features/auth/use-verification';
import { env } from '@/lib/env';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

const safetyItems = [
  ['✓', '여성 여부만 확인해요'],
  ['✓', '만 19세 이상인지 확인해요'],
  ['—', '주민등록번호를 저장하지 않아요'],
  ['—', '신분증 이미지를 저장하지 않아요'],
] as const;

export default function VerifyScreen() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const verification = useVerification(session?.user.id);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (verification.data?.is_verified && verification.data.is_female === true) {
      router.replace('/(auth)/profile-setup');
    }
  }, [verification.data]);

  async function startVerification() {
    if (!session) {
      router.replace('/(auth)/signup');
      return;
    }
    if (!env.EXPO_PUBLIC_VERIFICATION_URL) {
      Alert.alert(
        '본인인증 연결이 필요해요',
        '운영 환경에 EXPO_PUBLIC_VERIFICATION_URL을 설정해 주세요.',
      );
      return;
    }

    try {
      setPending(true);
      const redirectUrl = Linking.createURL('/verification-complete');
      const verificationUrl = new URL(env.EXPO_PUBLIC_VERIFICATION_URL);
      verificationUrl.searchParams.set('user_id', session.user.id);
      verificationUrl.searchParams.set('redirect_uri', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        verificationUrl.toString(),
        redirectUrl,
        { preferEphemeralSession: true },
      );
      if (result.type === 'success') {
        await queryClient.invalidateQueries({ queryKey: ['verification', session.user.id] });
        const refreshed = await verification.refetch();
        if (!refreshed.data?.is_verified || refreshed.data.is_female !== true) {
          Alert.alert('인증 결과를 확인하고 있어요', '잠시 후 다시 확인해 주세요.');
        }
      }
    } catch (error) {
      Alert.alert(
        '본인인증을 시작하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setPending(false);
    }
  }

  const blocked =
    verification.data !== null &&
    verification.data !== undefined &&
    (!verification.data.is_verified || verification.data.is_female !== true);

  return (
    <OnboardingShell
      step={2}
      footer={
        <Button
          label={pending ? '인증 연결 중...' : '휴대폰으로 본인인증'}
          disabled={pending || verification.isLoading}
          onPress={startVerification}
        />
      }
    >
      <Title>본인인증으로{'\n'}여성 전용 공간을 지켜요</Title>
      <Body style={styles.description}>안전한 연결을 위해 한 번만 확인할게요.</Body>

      <View style={styles.card}>
        {safetyItems.map(([symbol, label], index) => (
          <View key={label} style={[styles.row, index > 0 && styles.rowBorder]}>
            <View style={[styles.symbol, symbol === '✓' ? styles.positive : styles.private]}>
              <Text style={styles.symbolText}>{symbol}</Text>
            </View>
            <Text style={styles.rowLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {blocked ? (
        <Text accessibilityRole="alert" style={styles.blocked}>
          인증 요건을 충족하지 않아 Léve 서비스를 이용할 수 없어요.
        </Text>
      ) : (
        <Text style={styles.alternative}>PASS · 통신사 · 아이핀 인증을 지원해요</Text>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: spacing.md },
  card: {
    marginTop: 36,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 8,
    ...shadow.card,
  },
  row: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 13 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.hairline },
  symbol: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  positive: { backgroundColor: '#E6F4F0' },
  private: { backgroundColor: '#F0EEFA' },
  symbolText: {
    color: colors.teal,
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '700',
  },
  rowLabel: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    fontWeight: '500',
  },
  alternative: {
    marginTop: 'auto',
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    textAlign: 'center',
  },
  blocked: {
    marginTop: spacing.lg,
    color: colors.danger,
    fontFamily: typography.ko,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
