import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfilePhoto } from '@/components/profile-photo';
import { AppHeader } from '@/components/ui/app-header';
import { Screen } from '@/components/ui/screen';
import { useHostGathering, useReviewParticipant } from '@/features/community/hooks';
import { formatCommunityDate } from '@/features/community/presentation';
import type { HostParticipant } from '@/lib/supabase/database.types';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function HostGatheringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dashboard = useHostGathering(id);
  const review = useReviewParticipant();
  const gathering = dashboard.data;
  const pending = gathering?.participants.filter((item) => item.status === 'applied') ?? [];
  const confirmed = gathering?.participants.filter((item) => item.status === 'confirmed') ?? [];

  async function decide(participantId: string, decision: 'confirm' | 'reject') {
    try {
      await review.mutateAsync({ participantId, decision });
    } catch (error) {
      Alert.alert(
        '처리하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <Screen scroll style={styles.screen}>
      <AppHeader
        actionLabel="수정"
        onAction={() => router.push(`/host/gathering/${id}/edit`)}
        title="모임 관리"
      />
      {!gathering ? (
        <Text style={styles.state}>모임 정보를 불러오고 있어요.</Text>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.title}>{gathering.title}</Text>
            <Text style={styles.meta}>
              {formatCommunityDate(gathering.start_at)} · {gathering.region}
            </Text>
            <View style={styles.chips}>
              <Chip teal label={`모집 ${gathering.confirmed_count}/${gathering.capacity}`} />
              <Chip label={`신청 ${gathering.applied_count}`} />
            </View>
          </View>
          <Text style={styles.sectionLabel}>신청 대기 {pending.length}</Text>
          <View style={styles.participantCard}>
            {pending.length ? (
              pending.map((participant, index) => (
                <ParticipantRow
                  key={participant.id}
                  divider={index > 0}
                  participant={participant}
                  onConfirm={() => decide(participant.id, 'confirm')}
                  onReject={() => decide(participant.id, 'reject')}
                />
              ))
            ) : (
              <Text style={styles.empty}>새로운 신청을 기다리고 있어요.</Text>
            )}
          </View>
          <Text style={styles.sectionLabel}>참여 확정 {confirmed.length}</Text>
          <View style={styles.confirmedCard}>
            {confirmed.map((participant) => (
              <View key={participant.id} style={styles.confirmedMember}>
                <ProfilePhoto
                  label={participant.nickname}
                  path={participant.photo_path}
                  style={styles.confirmedPhoto}
                />
                <Text numberOfLines={1} style={styles.confirmedName}>
                  {participant.nickname ?? '멤버'}
                </Text>
              </View>
            ))}
            {!confirmed.length ? <Text style={styles.empty}>확정된 멤버가 없어요.</Text> : null}
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/host/cancel?id=${gathering.id}`)}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>모임 취소</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/host/gathering/${gathering.id}/edit`)}
              style={styles.edit}
            >
              <Text style={styles.editText}>모임 정보 수정</Text>
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

function Chip({ label, teal = false }: { label: string; teal?: boolean }) {
  return (
    <View style={[styles.chip, teal && styles.chipTeal]}>
      <Text style={[styles.chipText, teal && styles.chipTextTeal]}>{label}</Text>
    </View>
  );
}

function ParticipantRow({
  participant,
  divider,
  onConfirm,
  onReject,
}: {
  participant: HostParticipant;
  divider: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <View style={[styles.participant, divider && styles.divider]}>
      <ProfilePhoto
        label={participant.nickname}
        path={participant.photo_path}
        style={styles.photo}
      />
      <View style={styles.participantCopy}>
        <Text style={styles.participantName}>{participant.nickname ?? '멤버'}</Text>
        <Text numberOfLines={1} style={styles.participantMeta}>
          {participant.region ?? '지역 비공개'}
          {participant.age ? ` · ${participant.age}` : ''}
          {participant.bio ? ` · ${participant.bio}` : ''}
        </Text>
      </View>
      <View style={styles.reviewActions}>
        <Pressable onPress={onConfirm} style={styles.approve}>
          <Text style={styles.approveText}>승인</Text>
        </Pressable>
        <Pressable onPress={onReject} style={styles.reject}>
          <Text style={styles.rejectText}>거절</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0, gap: 12 },
  state: { color: colors.ink2, fontFamily: typography.ko, textAlign: 'center', paddingTop: 80 },
  summary: { borderRadius: 18, backgroundColor: colors.surface, padding: 16, ...shadow.card },
  title: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.ink2, fontFamily: typography.ko, fontSize: 13, marginTop: 6 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: '#F1EFF9',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipTeal: { backgroundColor: '#E4F5F1' },
  chipText: { color: colors.accent, fontFamily: typography.ko, fontSize: 12 },
  chipTextTeal: { color: colors.teal },
  sectionLabel: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
  },
  participantCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  participant: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  photo: { width: 44, height: 44, borderRadius: 22 },
  participantCopy: { flex: 1, gap: 3 },
  participantName: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    fontWeight: '700',
  },
  participantMeta: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  reviewActions: { gap: 5 },
  approve: {
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  approveText: { color: colors.surface, fontFamily: typography.ko, fontSize: 12 },
  reject: {
    borderRadius: radius.pill,
    backgroundColor: '#F0F0F3',
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  rejectText: { color: colors.ink2, fontFamily: typography.ko, fontSize: 12 },
  confirmedCard: {
    minHeight: 108,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 18,
    ...shadow.card,
  },
  confirmedMember: { width: 64, alignItems: 'center', gap: 7 },
  confirmedPhoto: { width: 56, height: 56, borderRadius: 28 },
  confirmedName: { color: colors.ink, fontFamily: typography.ko, fontSize: 12 },
  empty: {
    flex: 1,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg, paddingBottom: spacing.lg },
  cancel: {
    minHeight: 52,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: '#FBEAEC',
  },
  cancelText: { color: '#D95766', fontFamily: typography.ko, fontSize: 15, fontWeight: '700' },
  edit: {
    minHeight: 52,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: colors.accent,
    ...shadow.button,
  },
  editText: { color: colors.surface, fontFamily: typography.ko, fontSize: 15, fontWeight: '700' },
});
