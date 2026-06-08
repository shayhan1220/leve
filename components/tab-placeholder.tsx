import { StyleSheet } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Body, Title } from '@/components/ui/typography';
import { spacing } from '@/theme/tokens';

export function TabPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <Screen style={styles.screen}>
      <Title>{title}</Title>
      <Body>{description}</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({ screen: { paddingTop: spacing.xl, gap: spacing.sm } });
