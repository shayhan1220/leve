import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import type { DiscoverFilters } from '@/features/discovery/api';
import { useDiscoveryFilterStore } from '@/features/discovery/filter-store';
import { hasPlan, usePlan } from '@/features/subscription/use-plan';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const regions = ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '제주'];

export default function FilterScreen() {
  const stored = useDiscoveryFilterStore((state) => state.filters);
  const setFilters = useDiscoveryFilterStore((state) => state.setFilters);
  const reset = useDiscoveryFilterStore((state) => state.reset);
  const plan = usePlan();
  const plus = hasPlan(plan.data, 'plus');
  const [draft, setDraft] = useState<DiscoverFilters>(stored);

  function togglePremium(key: 'verified_only' | 'max_distance_km') {
    if (!plus) {
      Alert.alert('Léve Plus 기능이에요', '정밀 필터는 Plus 이상에서 사용할 수 있어요.');
      return;
    }
    if (key === 'verified_only') {
      setDraft((current) => ({ ...current, verified_only: !current.verified_only }));
    } else {
      setDraft((current) => ({
        ...current,
        max_distance_km: current.max_distance_km ? undefined : 25,
      }));
    }
  }

  function apply() {
    setFilters(draft);
    router.back();
  }

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          탐색 필터
        </Text>
        <Pressable
          onPress={() => {
            reset();
            setDraft({ limit: 20 });
          }}
          style={styles.reset}
        >
          <Text style={styles.resetText}>초기화</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>활동 지역</Text>
      <View style={styles.regionGrid}>
        {regions.map((region) => {
          const active = region === '전체' ? !draft.region : draft.region === region;
          return (
            <Pressable
              key={region}
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  region: region === '전체' ? undefined : region,
                }))
              }
              style={[styles.region, active && styles.regionActive]}
            >
              <Text style={[styles.regionText, active && styles.regionTextActive]}>{region}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>정밀 필터</Text>
      <FilterRow
        active={Boolean(draft.max_distance_km)}
        label="가까운 거리 우선"
        locked={!plus}
        onPress={() => togglePremium('max_distance_km')}
        value="25km 이내"
      />
      <FilterRow
        active={Boolean(draft.verified_only)}
        label="추가 인증 프로필"
        locked={!plus}
        onPress={() => togglePremium('verified_only')}
        value="인증 배지 보유"
      />

      <View style={styles.footer}>
        <Button label="필터 적용하기" onPress={apply} />
      </View>
    </Screen>
  );
}

function FilterRow({
  active,
  label,
  locked,
  onPress,
  value,
}: {
  active: boolean;
  label: string;
  locked: boolean;
  onPress: () => void;
  value: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{locked ? 'Plus 전용' : value}</Text>
      </View>
      <View style={[styles.switch, active && styles.switchActive]}>
        <View style={[styles.knob, active && styles.knobActive]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 24 },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 32 },
  title: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 20,
    fontWeight: '700',
  },
  reset: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  resetText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 14 },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: 12,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '700',
  },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  region: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  regionActive: { borderColor: colors.accent, backgroundColor: '#EFECF8' },
  regionText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 14 },
  regionTextActive: { color: colors.accent, fontWeight: '700' },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowLabel: { color: colors.ink, fontFamily: typography.ko, fontSize: 15, fontWeight: '600' },
  rowValue: { marginTop: 4, color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  switch: {
    width: 48,
    height: 28,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: '#D7D7DF',
    marginLeft: 'auto',
    paddingHorizontal: 3,
  },
  switchActive: { backgroundColor: colors.accent },
  knob: { width: 22, height: 22, borderRadius: radius.pill, backgroundColor: colors.surface },
  knobActive: { alignSelf: 'flex-end' },
  footer: { marginTop: 64, paddingBottom: spacing.lg },
});
