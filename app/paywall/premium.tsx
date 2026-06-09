import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors, spacing, typography } from '@/theme/tokens';

export default function PremiumPaywallScreen() {
  return (
    <Screen style={styles.screen}>
      <Pressable accessibilityLabel="닫기" onPress={() => router.back()} style={styles.close}>
        <Text style={styles.closeText}>×</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>LÉVE PREMIUM</Text>
        <Text style={styles.title}>나만의 모임을{'\n'}바로 열어보세요</Text>
        <Text style={styles.body}>
          Premium은 검토 없이 주 3회까지 모임을 직접 공개할 수 있어요.{'\n'}
          실제 가격은 RevenueCat 스토어 설정에서 불러옵니다.
        </Text>
      </View>
      <Button disabled label="상품 불러오기" onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 28 },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  closeText: { color: colors.ink2, fontSize: 30 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  eyebrow: {
    color: colors.gold,
    fontFamily: typography.display,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
  },
  title: {
    marginTop: spacing.md,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
  },
  body: {
    marginTop: spacing.md,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
