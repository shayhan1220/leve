import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { spacing } from '@/theme/tokens';

export default function VerifyScreen() {
  return (
    <Screen style={styles.screen}>
      <Title>여성 인증이 필요해요</Title>
      <Body>인증 결과만 저장하며 주민등록번호와 신분증 이미지는 저장하지 않아요.</Body>
      <Button label="본인인증 시작하기" onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({ screen: { justifyContent: 'center', gap: spacing.lg } });
