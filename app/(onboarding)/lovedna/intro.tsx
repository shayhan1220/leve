import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { useLoveDnaResponses } from '@/features/lovedna/hooks';
import { axisLabels } from '@/features/lovedna/presentation';
import { colors, radius, typography } from '@/theme/tokens';

export default function LoveDnaIntroScreen() {
  const responses = useLoveDnaResponses();
  const answeredCount = responses.data?.length ?? 0;

  return (
    <Screen style={styles.screen}>
      <Text accessibilityLabel="Léve" style={styles.logo}>
        Léve
      </Text>

      <View accessibilityLabel="Love DNA 이미지" style={styles.orb}>
        <View style={styles.orbTeal} />
        <View style={styles.orbRose} />
        <View style={styles.orbGlow} />
      </View>

      <View style={styles.copy}>
        <Title style={styles.title}>이제 당신의{'\n'}Love DNA를 알아볼까요?</Title>
        <Body style={styles.description}>
          40개의 질문으로 연애 성향을 5가지 축으로{'\n'}분석해, 더 잘 맞는 사람을 찾아드려요.
        </Body>
      </View>

      <View style={styles.chips}>
        {Object.values(axisLabels).map((axis) => (
          <View key={axis} style={styles.chip}>
            <Text style={styles.chipText}>{axis}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Body style={styles.note}>
          {answeredCount > 0
            ? `${answeredCount}개 답변 저장됨 · 언제든 이어서 할 수 있어요`
            : '약 5분 소요 · 언제든 이어서 할 수 있어요'}
        </Body>
        <Button
          label={answeredCount > 0 ? '이어서 하기' : '시작하기'}
          onPress={() => router.push('/(onboarding)/lovedna/questions')}
        />
        <Text style={styles.caption}>처음 40문항을 마치면 나의 클랜과 코드를 받아요.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 28 },
  logo: {
    marginTop: 14,
    color: colors.accent,
    fontFamily: typography.display,
    fontSize: 29,
    fontWeight: '600',
  },
  orb: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: '#8C7CD1',
    marginTop: 108,
  },
  orbTeal: {
    position: 'absolute',
    left: -18,
    top: -20,
    width: 118,
    height: 118,
    borderRadius: radius.pill,
    backgroundColor: '#63C8B1',
    opacity: 0.88,
  },
  orbRose: {
    position: 'absolute',
    right: -16,
    top: 12,
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: '#CC74A0',
    opacity: 0.78,
  },
  orbGlow: {
    position: 'absolute',
    left: 48,
    top: 48,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: '#F4F0E8',
    opacity: 0.8,
  },
  copy: { marginTop: 44, alignItems: 'center' },
  title: { fontSize: 26, lineHeight: 36, textAlign: 'center' },
  description: { marginTop: 12, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 280,
    marginTop: 18,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E8E8F0',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { color: colors.ink, fontFamily: typography.ko, fontSize: 13, fontWeight: '500' },
  footer: { marginTop: 'auto', gap: 12 },
  note: { color: '#9999AB', fontSize: 13, textAlign: 'center' },
  caption: {
    color: '#9999AB',
    fontFamily: typography.ko,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
