import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { colors, spacing, typography } from '@/theme/tokens';

export default function SplashScreen() {
  return (
    <Screen style={styles.screen}>
      <View>
        <Title style={styles.logo}>Léve</Title>
        <Body style={styles.slogan}>More Than Matching.</Body>
        <Body>매칭 그 이상의 관계</Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center' },
  logo: {
    color: colors.accent,
    fontFamily: typography.display,
    fontSize: 58,
    marginBottom: spacing.sm,
  },
  slogan: { color: colors.ink, fontWeight: '600' },
});
