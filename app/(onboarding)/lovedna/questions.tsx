import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Title } from '@/components/ui/typography';
import { useLoveDnaResponses, useSaveLoveDnaResponse } from '@/features/lovedna/hooks';
import { loveDnaQuestions } from '@/features/lovedna/questions';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const answerValues = { low: 25, neutral: 50, high: 75 } as const;
type AnswerKey = keyof typeof answerValues;

function answerKeyFor(value: number | undefined): AnswerKey | null {
  if (value === undefined) return null;
  if (value < 50) return 'low';
  if (value > 50) return 'high';
  return 'neutral';
}

export default function LoveDnaQuestionsScreen() {
  const responses = useLoveDnaResponses();

  const firstUnanswered = loveDnaQuestions.findIndex(
    (item) => !responses.data?.some((response) => response.question_id === item.id),
  );
  const initialIndex = firstUnanswered === -1 ? loveDnaQuestions.length - 1 : firstUnanswered;

  return (
    <QuestionFlow
      key={`question-${responses.isFetched ? initialIndex : 'loading'}`}
      initialIndex={initialIndex}
      savedResponses={responses.data ?? []}
    />
  );
}

function QuestionFlow({
  initialIndex,
  savedResponses,
}: {
  initialIndex: number;
  savedResponses: { question_id: number; value: number }[];
}) {
  const saveResponse = useSaveLoveDnaResponse();

  const answerMap = useMemo(
    () => new Map(savedResponses.map((response) => [response.question_id, response.value])),
    [savedResponses],
  );
  const [index, setIndex] = useState(initialIndex);
  const [selected, setSelected] = useState<AnswerKey | null>(() =>
    answerKeyFor(answerMap.get(loveDnaQuestions[initialIndex]!.id)),
  );
  const question = loveDnaQuestions[index]!;

  function moveTo(nextIndex: number) {
    setIndex(nextIndex);
    setSelected(answerKeyFor(answerMap.get(loveDnaQuestions[nextIndex]!.id)));
  }

  function goBack() {
    if (index === 0) {
      router.back();
      return;
    }
    moveTo(index - 1);
  }

  async function next() {
    if (!selected) return;
    try {
      await saveResponse.mutateAsync({
        question_id: question.id,
        axis: question.axis,
        value: answerValues[selected],
      });
      if (index === loveDnaQuestions.length - 1) {
        router.replace('./analyzing');
      } else {
        moveTo(index + 1);
      }
    } catch (error) {
      Alert.alert(
        '답변을 저장하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  const progress = `${((index + 1) / loveDnaQuestions.length) * 100}%` as `${number}%`;

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="이전 질문"
          accessibilityRole="button"
          hitSlop={12}
          onPress={goBack}
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.count}>
          {index + 1} / {loveDnaQuestions.length}
        </Text>
      </View>

      <View style={styles.progress}>
        <View style={[styles.progressActive, { width: progress }]} />
      </View>

      <Text style={styles.category}>{question.category}</Text>
      <Title style={styles.question}>{question.prompt}</Title>

      <View style={styles.answers}>
        <AnswerCard
          active={selected === 'high'}
          label={question.high}
          onPress={() => setSelected('high')}
        />
        <AnswerCard
          active={selected === 'low'}
          label={question.low}
          onPress={() => setSelected('low')}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selected === 'neutral' }}
          onPress={() => setSelected('neutral')}
          style={styles.neutral}
        >
          <Text style={[styles.neutralText, selected === 'neutral' && styles.neutralTextActive]}>
            둘 다 비슷해요
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Button
          label={
            saveResponse.isPending
              ? '저장 중...'
              : index === loveDnaQuestions.length - 1
                ? '분석하기'
                : '다음 질문'
          }
          disabled={!selected || saveResponse.isPending}
          onPress={next}
        />
        <Text style={styles.caption}>정직하게 답할수록 더 잘 맞는 사람을 만나요.</Text>
      </View>
    </Screen>
  );
}

function AnswerCard({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.answer, active && styles.answerActive]}
    >
      <Text style={styles.answerText}>{label}</Text>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <Text style={styles.check}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 10,
  },
  header: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, justifyContent: 'center' },
  backText: { color: colors.ink2, fontSize: 30, lineHeight: 34 },
  count: {
    marginLeft: 'auto',
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '500',
  },
  progress: {
    height: 6,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: '#E8E8F0',
    marginTop: 8,
  },
  progressActive: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  category: {
    marginTop: 34,
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
  },
  question: { marginTop: 10, fontSize: 24, lineHeight: 33 },
  answers: { gap: spacing.md, marginTop: 44 },
  answer: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#EBEBF2',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  answerActive: { borderWidth: 1.5, borderColor: colors.accent, backgroundColor: '#F0EEF8' },
  answerText: {
    flex: 1,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 23,
  },
  radio: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D5D4E2',
    borderRadius: radius.pill,
  },
  radioActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  check: { color: colors.surface, fontSize: 13, fontWeight: '700' },
  neutral: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  neutralText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 14 },
  neutralTextActive: { color: colors.accent, fontWeight: '700' },
  footer: { marginTop: 'auto', gap: 12 },
  caption: {
    color: '#9999AB',
    fontFamily: typography.ko,
    fontSize: 11,
    textAlign: 'center',
  },
});
