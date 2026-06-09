import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors, typography } from '@/theme/tokens';

export default function GatheringAppliedScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const review = type === 'review';
  return (
    <Screen style={styles.screen}>
      <View style={styles.mark}>
        <Text style={styles.check}>✓</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {review ? '모임 검토를 요청했어요' : '참여 신청이 완료됐어요'}
      </Text>
      <Text style={styles.body}>
        {review
          ? '안전한 커뮤니티를 위해 운영팀이 확인한 뒤 공개해요.'
          : '호스트가 확인하면 알림으로 결과를 알려드릴게요.'}
      </Text>
      <Button label="커뮤니티로 돌아가기" onPress={() => router.replace('/(tabs)/community')} />
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
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
});
