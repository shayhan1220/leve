import { useState, type ComponentProps } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import type { GatheringInput } from '@/features/community/api';
import { formatDateTimeInput, parseDateTimeInput } from '@/features/community/presentation';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export function GatheringForm({
  submitLabel,
  pending,
  initial,
  onSubmit,
}: {
  submitLabel: string;
  pending: boolean;
  initial?: Partial<GatheringInput>;
  onSubmit: (input: GatheringInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '친목');
  const [region, setRegion] = useState(initial?.region ?? '서울');
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 8));
  const [dateTime, setDateTime] = useState(
    initial?.start_at ? formatDateTimeInput(new Date(initial.start_at)) : '',
  );
  const [type, setType] = useState<'meetup' | 'flash'>(initial?.type ?? 'meetup');
  const [isQueer, setIsQueer] = useState(initial?.is_queer ?? false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    try {
      await onSubmit({
        title,
        description,
        category,
        region,
        capacity: Number(capacity),
        start_at: parseDateTimeInput(dateTime),
        type,
        is_queer: isQueer,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '입력 내용을 확인해 주세요.');
    }
  }

  return (
    <View style={styles.form}>
      <Field
        label="모임 이름"
        value={title}
        onChangeText={setTitle}
        placeholder="모임 이름을 입력해 주세요"
      />
      <Field
        label="소개"
        value={description}
        onChangeText={setDescription}
        placeholder="누구와 무엇을 함께하는 모임인지 알려주세요"
        multiline
      />
      <View style={styles.row}>
        <Field compact label="카테고리" value={category} onChangeText={setCategory} />
        <Field compact label="지역" value={region} onChangeText={setRegion} />
      </View>
      <View style={styles.row}>
        <Field
          compact
          keyboardType="number-pad"
          label="정원"
          value={capacity}
          onChangeText={setCapacity}
        />
        <Field
          compact
          label="날짜·시간"
          placeholder="2026-06-20 14:00"
          value={dateTime}
          onChangeText={setDateTime}
        />
      </View>
      <View style={styles.segment}>
        {(['meetup', 'flash'] as const).map((value) => (
          <Text
            key={value}
            accessibilityRole="button"
            onPress={() => setType(value)}
            style={[styles.segmentItem, type === value && styles.segmentActive]}
          >
            {value === 'meetup' ? '밋업' : '플래시'}
          </Text>
        ))}
      </View>
      <View style={styles.toggle}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>퀴어 모임</Text>
          <Text style={styles.hint}>퀴어 옵트인 멤버에게만 보여요.</Text>
        </View>
        <Switch
          accessibilityLabel="퀴어 모임"
          onValueChange={setIsQueer}
          trackColor={{ false: '#D9D9E2', true: '#DDB4C7' }}
          thumbColor={isQueer ? colors.rose : colors.surface}
          value={isQueer}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button disabled={pending} label={pending ? '처리 중...' : submitLabel} onPress={submit} />
    </View>
  );
}

function Field({
  label,
  compact,
  ...props
}: {
  label: string;
  compact?: boolean;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={compact ? styles.compact : undefined}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#9A9AA7"
        style={[styles.input, props.multiline && styles.multiline]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  label: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 7,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    paddingHorizontal: 16,
  },
  multiline: { minHeight: 112, paddingTop: 14, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  compact: { flex: 1 },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.field,
    backgroundColor: '#ECEAF4',
    padding: 4,
  },
  segmentItem: {
    minHeight: 44,
    flex: 1,
    overflow: 'hidden',
    borderRadius: 11,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    lineHeight: 44,
    textAlign: 'center',
  },
  segmentActive: { backgroundColor: colors.surface, color: colors.accent, fontWeight: '700' },
  toggle: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  toggleCopy: { flex: 1, gap: 4 },
  toggleTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 15, fontWeight: '700' },
  hint: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  error: { color: colors.danger, fontFamily: typography.ko, fontSize: 13 },
});
