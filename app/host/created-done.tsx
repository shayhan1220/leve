import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors, typography } from '@/theme/tokens';

export default function HostedCreatedDoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen style={styles.screen}>
      <View style={styles.mark}>
        <Text style={styles.check}>✓</Text>
      </View>
      <Text style={styles.title}>모임이 바로 공개됐어요</Text>
      <Text style={styles.body}>신청자가 생기면 알림으로 알려드릴게요.</Text>
      <Button label="모임 관리하기" onPress={() => router.replace(`/host/gathering/${id}`)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', gap: 18 },
  mark: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 39,
    backgroundColor: '#E4F5F1',
  },
  check: { color: colors.teal, fontSize: 34, fontWeight: '700' },
  title: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
});
