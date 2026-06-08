import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function LoveDnaQuestionsScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.progress}>
        <View style={styles.progressActive} />
      </View>
      <View>
        <Body style={styles.count}>1 / 40</Body>
        <Title style={styles.question}>새로운 관계는 천천히 알아가는 편이 좋아요.</Title>
      </View>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Love DNA 문항 저장과 분석 흐름은 다음 구현 단계에서 이어집니다.
        </Text>
      </View>
      <Button label="인트로로 돌아가기" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.xl, paddingTop: spacing.lg },
  progress: {
    height: 5,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
  },
  progressActive: { width: '2.5%', height: '100%', backgroundColor: colors.accent },
  count: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  question: { marginTop: spacing.md, fontSize: 27, lineHeight: 38 },
  notice: {
    marginTop: 'auto',
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
