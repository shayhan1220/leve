import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function MatchMadeScreen() {
  const params = useLocalSearchParams<{
    chatId?: string;
    name?: string;
    compatibility?: string;
  }>();

  return (
    <Screen style={styles.screen}>
      <View style={styles.glow} />
      <View style={styles.portraits}>
        <View style={[styles.portrait, styles.portraitLeft]}>
          <Text style={styles.initial}>L</Text>
        </View>
        <View style={[styles.portrait, styles.portraitRight]}>
          <Text style={styles.initial}>{params.name?.slice(0, 1) ?? 'L'}</Text>
        </View>
        <View style={styles.heart}>
          <Text style={styles.heartText}>♥</Text>
        </View>
      </View>

      <Text accessibilityRole="header" style={styles.title}>
        서로 좋아했어요
      </Text>
      <Text style={styles.subtitle}>{params.name ?? '새로운 인연'}님과 매칭됐어요</Text>
      <View style={styles.compatibility}>
        <Text style={styles.compatibilityText}>
          Love DNA {params.compatibility ?? '—'}% · 잘 통하는 사이
        </Text>
      </View>
      <Text style={styles.prompt}>먼저 따뜻한 인사를 건네보세요.</Text>

      <View style={styles.footer}>
        <Button
          label="메시지 보내기"
          onPress={() =>
            params.chatId
              ? router.replace({ pathname: '/chat/[id]', params: { id: params.chatId } })
              : router.replace('/(tabs)/matches')
          }
        />
        <Pressable onPress={() => router.replace('/(tabs)/discover')} style={styles.continue}>
          <Text style={styles.continueText}>계속 둘러보기</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  glow: {
    position: 'absolute',
    top: 100,
    width: 420,
    height: 420,
    borderRadius: radius.pill,
    backgroundColor: '#F3EAF1',
    opacity: 0.75,
  },
  portraits: { width: 220, height: 150, marginTop: 210 },
  portrait: {
    position: 'absolute',
    top: 0,
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    borderRadius: radius.pill,
  },
  portraitLeft: { left: 0, backgroundColor: '#C998C2' },
  portraitRight: { right: 0, backgroundColor: '#71B8AE' },
  initial: {
    color: colors.surface,
    fontFamily: typography.display,
    fontSize: 42,
    fontWeight: '600',
  },
  heart: {
    position: 'absolute',
    left: 84,
    top: 49,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  heartText: { color: colors.surface, fontSize: 23 },
  title: { color: colors.ink, fontFamily: typography.ko, fontSize: 28, fontWeight: '700' },
  subtitle: {
    marginTop: 4,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '500',
  },
  compatibility: {
    borderRadius: radius.pill,
    backgroundColor: '#EDEAF7',
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  compatibilityText: {
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
  },
  prompt: { marginTop: 22, color: colors.ink2, fontFamily: typography.ko, fontSize: 14 },
  footer: { width: '100%', gap: spacing.sm, marginTop: 'auto' },
  continue: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  continueText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 15, fontWeight: '500' },
});
