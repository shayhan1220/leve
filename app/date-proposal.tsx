import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/store';
import { useCreateDateProposal } from '@/features/chat/hooks';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

const activities = ['전시', '카페', '산책', '맛집', '영화'] as const;
const scheduleOffsets = [
  { label: '이번 토요일 오후 2시', weekday: 6, hour: 14, weeksAhead: 0 },
  { label: '이번 일요일 오후 3시', weekday: 0, hour: 15, weeksAhead: 0 },
  { label: '다음 금요일 저녁 7시', weekday: 5, hour: 19, weeksAhead: 1 },
] as const;

export default function DateProposalScreen() {
  const { chatId, name } = useLocalSearchParams<{ chatId?: string; name?: string }>();
  const userId = useAuthStore((state) => state.session?.user.id);
  const create = useCreateDateProposal();
  const [activity, setActivity] = useState<(typeof activities)[number]>('전시');
  const [scheduleIndex, setScheduleIndex] = useState(0);
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('전시 보고 근처에서 커피 어때요?');
  const schedule = scheduleOffsets[scheduleIndex] ?? scheduleOffsets[0];
  const datetime = useMemo(
    () => nextWeekday(schedule.weekday, schedule.hour, schedule.weeksAhead),
    [schedule],
  );

  async function submit() {
    if (!chatId || !userId) return;
    try {
      await create.mutateAsync({
        chat_id: chatId,
        datetime: datetime.toISOString(),
        place: `${activity} · ${place.trim()}`,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        '제안을 보내지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <Pressable
      accessibilityLabel="데이트 제안 닫기"
      onPress={() => router.back()}
      style={styles.overlay}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
        style={styles.keyboard}
      >
        <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={styles.safe}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
            <View style={styles.handle} />
            <Text accessibilityRole="header" style={styles.title}>
              데이트 제안하기
            </Text>
            <Text style={styles.subtitle}>{name ?? '상대'}님에게 어떤 데이트를 제안할까요?</Text>

            <Text style={styles.label}>활동</Text>
            <View style={styles.chips}>
              {activities.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setActivity(item)}
                  style={[styles.chip, activity === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, activity === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>언제</Text>
            <Pressable
              onPress={() => setScheduleIndex((current) => (current + 1) % scheduleOffsets.length)}
              style={styles.field}
            >
              <Text style={styles.fieldValue}>{schedule.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Text style={styles.label}>어디서</Text>
            <TextInput
              maxLength={120}
              onChangeText={setPlace}
              placeholder="장소를 입력해 주세요"
              placeholderTextColor="#85838D"
              style={styles.textInput}
              value={place}
            />

            <Text style={styles.label}>한마디</Text>
            <TextInput
              maxLength={500}
              onChangeText={setNote}
              placeholder="함께 보낼 메시지를 입력해 주세요"
              placeholderTextColor="#85838D"
              style={styles.textInput}
              value={note}
            />

            <Button
              label={create.isPending ? '보내는 중...' : '제안 보내기'}
              disabled={create.isPending || place.trim().length < 2}
              onPress={submit}
              style={styles.submit}
            />
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

function nextWeekday(weekday: number, hour: number, weeksAhead: number) {
  const value = new Date();
  let days = (weekday - value.getDay() + 7) % 7;
  if (days === 0 && value.getHours() >= hour) days = 7;
  value.setDate(value.getDate() + days + weeksAhead * 7);
  value.setHours(hour, 0, 0, 0);
  return value;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,26,36,0.76)' },
  keyboard: { flex: 1, justifyContent: 'flex-end' },
  safe: { justifyContent: 'flex-end' },
  sheet: {
    minHeight: 556,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 16,
    ...shadow.card,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: '#D1D1DB',
  },
  title: {
    marginTop: 20,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: { marginTop: 4, color: colors.ink2, fontFamily: typography.ko, fontSize: 13 },
  label: {
    marginTop: 23,
    marginBottom: 8,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
  },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5ED',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.surface },
  field: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8F0',
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  fieldValue: {
    flex: 1,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    fontWeight: '500',
  },
  chevron: { color: colors.ink2, fontSize: 22 },
  textInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#E8E8F0',
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    paddingHorizontal: 16,
  },
  submit: { marginTop: spacing.xl, marginBottom: 8 },
});
