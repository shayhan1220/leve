import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

const axes = ['연애 속도', '관계 방향', '마음의 거리', '가치관', '성향'];

export default function LoveDnaIntroScreen() {
  return (
    <Screen style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>LOVE DNA</Text>
        <Title>나의 관계 방식을{'\n'}더 선명하게 알아봐요</Title>
        <Body style={styles.description}>
          40개의 질문으로 다섯 가지 관계 축을 분석해 잘 맞는 연결을 찾아드려요.
        </Body>
      </View>

      <View style={styles.card}>
        {axes.map((axis, index) => (
          <View key={axis} style={styles.axis}>
            <View style={[styles.dot, { opacity: 1 - index * 0.12 }]} />
            <Text style={styles.axisText}>{axis}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Body style={styles.note}>약 5분 · 답변은 언제든 이어서 할 수 있어요</Body>
        <Button
          label="Love DNA 시작하기"
          onPress={() => router.push('/(onboarding)/lovedna/questions')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 54 },
  eyebrow: {
    marginBottom: 12,
    color: colors.accent,
    fontFamily: typography.display,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
  },
  description: { marginTop: spacing.md },
  card: {
    marginTop: 42,
    gap: 20,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadow.card,
  },
  axis: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: { width: 12, height: 12, borderRadius: radius.pill, backgroundColor: colors.accent },
  axisText: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: { marginTop: 'auto', gap: spacing.md },
  note: { fontSize: 13, textAlign: 'center' },
});
