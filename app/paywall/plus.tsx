import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors, spacing, typography } from '@/theme/tokens';

export default function PlusPaywallScreen() {
  return (
    <Screen style={styles.screen}>
      <Pressable accessibilityLabel="닫기" onPress={() => router.back()} style={styles.close}>
        <Text style={styles.closeText}>×</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>LÉVE PLUS</Text>
        <Text style={styles.title}>좋아요를 보낸 사람을{'\n'}바로 확인하세요</Text>
        <Text style={styles.body}>
          실제 가격과 상품 정보는 RevenueCat 스토어 설정에서 불러옵니다.
        </Text>
      </View>
      <Button label="상품 불러오기" disabled onPress={() => {}} />
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
    color: colors.accent,
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
