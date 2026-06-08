import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Title } from '@/components/ui/typography';
import { useProfileSetupStore } from '@/features/auth/profile-setup-store';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const regions = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

export default function RegionScreen() {
  const selected = useProfileSetupStore((state) => state.region);
  const setRegion = useProfileSetupStore((state) => state.setRegion);

  function select(region: string) {
    setRegion(region);
    router.back();
  }

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Title style={styles.title}>지역 선택</Title>
      </View>
      <View style={styles.grid}>
        {regions.map((region) => {
          const active = selected === region;
          return (
            <Pressable
              key={region}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => select(region)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{region}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.sm },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 36, lineHeight: 38 },
  title: { fontSize: 24, lineHeight: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.lg },
  option: {
    minWidth: '29%',
    minHeight: 52,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
  },
  optionActive: { borderColor: colors.accent, backgroundColor: '#EFECFA' },
  optionText: { color: colors.ink, fontFamily: typography.ko, fontSize: 15 },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
});
