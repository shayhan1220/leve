import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { requestOtp } from '@/features/auth/api';
import { colors, radius, spacing } from '@/theme/tokens';

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
    <Screen style={styles.screen}>
      <Title>휴대폰 번호로 시작해요</Title>
      <Body style={styles.description}>본인 명의 휴대폰으로 안전하게 가입할 수 있어요.</Body>
      <TextInput
        accessibilityLabel="휴대폰 번호"
        keyboardType="phone-pad"
        placeholder="01012345678"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />
      <Button
        label={pending ? '전송 중...' : '인증번호 받기'}
        disabled={pending}
        onPress={submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', gap: spacing.md },
  description: { marginBottom: spacing.md },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 17,
  },
});
