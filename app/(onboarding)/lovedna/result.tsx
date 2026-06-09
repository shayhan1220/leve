import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useLoveDna } from '@/features/lovedna/use-love-dna';
import { axisLabels, clanPresentation, displayLoveDnaCode } from '@/features/lovedna/presentation';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function LoveDnaResultScreen() {
  const result = useLoveDna(true);
  const profile = result.data;

  if (result.isLoading) return null;
  if (!profile) {
    return <Redirect href="/(onboarding)/lovedna/intro" />;
  }

  const clan = clanPresentation[profile.clan];
  const axes = [
    ['S', Number(profile.axis_s)],
    ['D', Number(profile.axis_d)],
    ['A', Number(profile.axis_a)],
    ['V', Number(profile.axis_v)],
    ['M', Number(profile.axis_m)],
  ] as const;

  return (
    <Screen scroll style={styles.screen}>
      <Text accessibilityLabel="Léve" style={styles.logo}>
        Léve
      </Text>
      <View style={styles.orb}>
        <View style={styles.orbTeal} />
        <View style={styles.orbRose} />
        <View style={styles.orbGlow} />
      </View>

      <Text style={styles.eyebrow}>나의 Love DNA</Text>
      <Text accessibilityRole="header" style={styles.clan}>
        {profile.clan}
      </Text>
      <Text style={styles.tagline}>
        {clan.korean} · {clan.tagline}
      </Text>
      <View style={styles.codePill}>
        <Text style={styles.code}>{displayLoveDnaCode(profile)}</Text>
      </View>
      <Text style={styles.description}>{clan.description}</Text>

      <View style={styles.analysis}>
        <Text style={styles.analysisTitle}>성향 분석</Text>
        {axes.map(([axis, value]) => (
          <View key={axis} style={styles.axisRow}>
            <Text style={styles.axisLabel}>{axisLabels[axis]}</Text>
            <View style={styles.axisTrack}>
              <View
                style={[
                  styles.axisValue,
                  { width: `${Math.max(0, Math.min(100, value))}%` as `${number}%` },
                ]}
              />
            </View>
            <Text style={styles.axisNumber}>{Math.round(value)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.accuracy}>
        <Text style={styles.accuracyText}>정확도 {profile.answered_count} / 100</Text>
        <Text style={styles.accuracyHint}>질문을 더 풀면 정교해져요</Text>
      </View>
      <Button label="내 매칭 보러가기" onPress={() => router.replace('/(tabs)/discover')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 28,
  },
  logo: {
    color: colors.accent,
    fontFamily: typography.display,
    fontSize: 29,
    fontWeight: '600',
  },
  orb: {
    width: 104,
    height: 104,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: '#8C7CD1',
    marginTop: 12,
  },
  orbTeal: {
    position: 'absolute',
    left: -8,
    top: -10,
    width: 78,
    height: 78,
    borderRadius: radius.pill,
    backgroundColor: '#63C8B1',
    opacity: 0.86,
  },
  orbRose: {
    position: 'absolute',
    right: -8,
    top: 12,
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: '#CC74A0',
    opacity: 0.76,
  },
  orbGlow: {
    position: 'absolute',
    left: 33,
    top: 33,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: '#F4F0E8',
    opacity: 0.82,
  },
  eyebrow: {
    marginTop: 14,
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  clan: {
    marginTop: 2,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 2,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  codePill: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    backgroundColor: '#EDEAF7',
    marginTop: spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  code: {
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  description: {
    marginTop: spacing.md,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  analysis: {
    gap: 15,
    borderWidth: 1,
    borderColor: '#EDEDF5',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    padding: 20,
  },
  analysisTitle: {
    marginBottom: 2,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
  },
  axisRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  axisLabel: {
    width: 74,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
  },
  axisTrack: {
    height: 8,
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: '#EBEBF2',
  },
  axisValue: { height: '100%', borderRadius: radius.pill, backgroundColor: '#8878C9' },
  axisNumber: {
    width: 30,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    textAlign: 'right',
  },
  accuracy: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  accuracyText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  accuracyHint: { color: '#9999AB', fontFamily: typography.ko, fontSize: 12 },
});
