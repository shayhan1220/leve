import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Body, Title } from '@/components/ui/typography';
import { requestOtp } from '@/features/auth/api';
import { colors, spacing, typography } from '@/theme/tokens';

export default function SignupScreen() {
  const [phone, setPhone] = useState('');
  const [pending, setPending] = useState(false);

  async function submit() {
    try {
      setPending(true);
      await requestOtp(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (error) {
      Alert.alert(
        '인증번호를 보내지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <OnboardingShell
      step={1}
      footer={
        <>
          <Button
            label={pending ? '전송 중...' : '인증번호 받기'}
            disabled={pending || phone.replace(/\D/g, '').length < 10}
            onPress={submit}
          />
          <Text style={styles.legal}>
            계속하면 Léve의 <Text style={styles.legalLink}>이용약관</Text>과{' '}
            <Text style={styles.legalLink}>개인정보 처리방침</Text>에 동의하게 됩니다.
          </Text>
        </>
      }
    >
      <Title>휴대폰 번호로{'\n'}시작할게요</Title>
      <Body style={styles.description}>본인 명의 휴대폰 번호를 입력해 주세요.</Body>
      <View style={styles.form}>
        <FormField
          accessibilityLabel="휴대폰 번호"
          autoComplete="tel"
          keyboardType="phone-pad"
          label="휴대폰 번호"
          maxLength={13}
          placeholder="010 1234 5678"
          value={phone}
          onChangeText={setPhone}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: spacing.md },
  form: { marginTop: 52 },
  legal: {
    marginTop: 14,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  legalLink: { color: colors.accent, textDecorationLine: 'underline' },
});
