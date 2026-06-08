import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Body, Title } from '@/components/ui/typography';
import { requestOtp, verifyOtp } from '@/features/auth/api';
import { colors, spacing, typography } from '@/theme/tokens';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [token, setToken] = useState('');
  const [pending, setPending] = useState(false);

  async function submit() {
    try {
      setPending(true);
      await verifyOtp(phone, token);
      router.replace('/(auth)/verify');
    } catch (error) {
      Alert.alert(
        '인증번호를 확인해 주세요',
        error instanceof Error ? error.message : '인증에 실패했어요.',
      );
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    try {
      await requestOtp(phone);
      Alert.alert('인증번호를 다시 보냈어요');
    } catch (error) {
      Alert.alert(
        '다시 보내지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <OnboardingShell
      step={1}
      footer={
        <Button
          label={pending ? '확인 중...' : '확인'}
          disabled={pending || token.length !== 6}
          onPress={submit}
        />
      }
    >
      <Title>인증번호를{'\n'}입력해 주세요</Title>
      <Body style={styles.description}>{phone} 번호로 보낸 6자리 번호예요.</Body>
      <View style={styles.form}>
        <FormField
          accessibilityLabel="인증번호"
          autoComplete="sms-otp"
          keyboardType="number-pad"
          label="인증번호"
          maxLength={6}
          placeholder="000000"
          value={token}
          onChangeText={(value) => setToken(value.replace(/\D/g, ''))}
          style={styles.code}
        />
        <Text accessibilityRole="button" onPress={resend} style={styles.resend}>
          인증번호 다시 받기
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: spacing.md },
  form: { marginTop: 52, gap: spacing.md },
  code: {
    fontSize: 20,
    letterSpacing: 7,
    textAlign: 'center',
  },
  resend: {
    minHeight: 44,
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 44,
    textAlign: 'center',
  },
});
