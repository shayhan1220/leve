import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { useComputeLoveDna } from '@/features/lovedna/hooks';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function LoveDnaAnalyzingScreen() {
  const compute = useComputeLoveDna();
  const rotation = useRef(new Animated.Value(0)).current;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  useEffect(() => {
    void analyze();
    // analyze intentionally runs once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze() {
    setError(null);
    try {
      const minimumDelay = new Promise((resolve) => setTimeout(resolve, 1400));
      await Promise.all([compute.mutateAsync(), minimumDelay]);
      router.replace('./result');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '분석을 완료하지 못했어요.');
    }
  }

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Screen style={styles.screen}>
      <Animated.View style={[styles.orb, { transform: [{ rotate: spin }] }]}>
        <View style={styles.orbTeal} />
        <View style={styles.orbRose} />
        <View style={styles.orbGlow} />
      </Animated.View>
      <Title style={styles.title}>Love DNA를 분석하고 있어요</Title>
      <Body style={styles.description}>
        다섯 가지 관계 축을 살펴보고{'\n'}당신만의 클랜과 코드를 만들고 있어요.
      </Body>
      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label="다시 분석하기" onPress={analyze} />
        </View>
      ) : (
        <Text style={styles.note}>잠시만 기다려 주세요</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  orb: {
    width: 170,
    height: 170,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: '#8C7CD1',
  },
  orbTeal: {
    position: 'absolute',
    left: -20,
    top: -18,
    width: 130,
    height: 130,
    borderRadius: radius.pill,
    backgroundColor: '#63C8B1',
    opacity: 0.86,
  },
  orbRose: {
    position: 'absolute',
    right: -18,
    top: 22,
    width: 128,
    height: 128,
    borderRadius: radius.pill,
    backgroundColor: '#CC74A0',
    opacity: 0.76,
  },
  orbGlow: {
    position: 'absolute',
    left: 54,
    top: 54,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: '#F4F0E8',
    opacity: 0.82,
  },
  title: { marginTop: 52, fontSize: 26, textAlign: 'center' },
  description: { marginTop: spacing.md, textAlign: 'center' },
  note: {
    marginTop: spacing.xl,
    color: '#9999AB',
    fontFamily: typography.ko,
    fontSize: 13,
  },
  error: { width: '100%', gap: spacing.md, marginTop: spacing.xl },
  errorText: {
    color: colors.danger,
    fontFamily: typography.ko,
    fontSize: 13,
    textAlign: 'center',
  },
});
