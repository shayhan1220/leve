import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { verifyOtp } from '@/features/auth/api';
import { colors, radius, spacing } from '@/theme/tokens';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [token, setToken] = useState('');

  async function submit() {
    try {
      await verifyOtp(phone, token);
      router.replace('/(auth)/verify');
    } catch (error) {
      Alert.alert(
        '인증번호를 확인해 주세요',
        error instanceof Error ? error.message : '인증에 실패했어요.',
      );
    }
  }

  return (
    <Screen style={styles.screen}>
      <Title>인증번호를 입력해 주세요</Title>
      <Body>{phone} 번호로 보낸 6자리 번호예요.</Body>
      <TextInput
        accessibilityLabel="인증번호"
        keyboardType="number-pad"
        maxLength={6}
        value={token}
        onChangeText={setToken}
        style={styles.input}
      />
      <Button label="확인" onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', gap: spacing.md },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
  },
});
