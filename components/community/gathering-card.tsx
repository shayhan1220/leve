import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCommunityDate, gatheringStatusLabel } from '@/features/community/presentation';
import type { Gathering, GatheringStatus } from '@/lib/supabase/database.types';
import { colors, radius, shadow, typography } from '@/theme/tokens';

type Counts = { confirmed_count?: number; applied_count?: number };

export function GatheringCard({
  gathering,
  onPress,
  compact = false,
}: {
  gathering: Gathering & Counts;
  onPress: () => void;
  compact?: boolean;
}) {
  const status = gatheringStatusLabel(gathering.status);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View
        style={[
          styles.art,
          gathering.type === 'flash' && styles.artTeal,
          gathering.is_queer && styles.artQueer,
        ]}
      >
        <Text style={styles.artText}>{gathering.type === 'flash' ? 'F' : 'L'}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.tags}>
          <Tag
            label={gathering.type === 'flash' ? '플래시' : '밋업'}
            teal={gathering.type === 'flash'}
          />
          {gathering.is_queer ? <Tag label="퀴어" rose /> : null}
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {gathering.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {formatCommunityDate(gathering.start_at)} · {gathering.region}
          {!compact && gathering.confirmed_count !== undefined
            ? ` · ${gathering.confirmed_count}/${gathering.capacity}명`
            : ''}
        </Text>
        {compact ? (
          <View style={styles.statusRow}>
            <Status status={gathering.status} label={status} />
            {gathering.applied_count ? <Tag label={`신청 ${gathering.applied_count}`} /> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function Tag({
  label,
  teal = false,
  rose = false,
}: {
  label: string;
  teal?: boolean;
  rose?: boolean;
}) {
  return (
    <View style={[styles.tag, teal && styles.tagTeal, rose && styles.tagRose]}>
      <Text style={[styles.tagText, teal && styles.tagTextTeal, rose && styles.tagTextRose]}>
        {label}
      </Text>
    </View>
  );
}

function Status({ label, status }: { label: string; status: GatheringStatus }) {
  return (
    <View style={[styles.tag, status === 'open' && styles.tagTeal]}>
      <Text style={[styles.tagText, status === 'open' && styles.tagTextTeal]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#EDEDF5',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: 13,
    ...shadow.card,
  },
  art: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#B8A8E0',
  },
  artTeal: { backgroundColor: '#73C2B0' },
  artQueer: { backgroundColor: '#C89ED9' },
  artText: { color: 'rgba(255,255,255,0.72)', fontSize: 26, fontWeight: '700' },
  content: { flex: 1, gap: 4 },
  tags: { minHeight: 24, flexDirection: 'row', gap: 6 },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: '#F1EFF9',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagTeal: { backgroundColor: '#E4F5F1' },
  tagRose: { backgroundColor: '#F8E8EF' },
  tagText: { color: colors.accent, fontFamily: typography.ko, fontSize: 12 },
  tagTextTeal: { color: colors.teal },
  tagTextRose: { color: colors.rose },
  title: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.ink2, fontFamily: typography.ko, fontSize: 13 },
  statusRow: { minHeight: 24, flexDirection: 'row', gap: 8, marginTop: 2 },
});
