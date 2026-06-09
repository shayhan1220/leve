import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { Screen } from '@/components/ui/screen';
import { useMyApplications } from '@/features/community/hooks';
import { formatCommunityDate } from '@/features/community/presentation';
import { participantStatusLabel } from '@/features/community/api';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function MyApplicationsScreen() {
  const applications = useMyApplications();
  return (
    <Screen scroll style={styles.screen}>
      <AppHeader title="내 신청 현황" />
      <View style={styles.list}>
        {applications.data?.map((application) => (
          <Pressable
            key={application.id}
            onPress={() => router.push(`/gathering/${application.gathering_id}`)}
            style={styles.card}
          >
            <Text style={styles.title}>{application.title}</Text>
            <Text style={styles.meta}>
              {formatCommunityDate(application.start_at)} · {application.region}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{participantStatusLabel(application.status)}</Text>
            </View>
          </Pressable>
        ))}
        {!applications.isLoading && !applications.data?.length ? (
          <Text style={styles.empty}>신청한 모임이 없어요.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0 },
  list: { gap: 12, paddingVertical: spacing.md },
  card: { borderRadius: radius.card, backgroundColor: colors.surface, padding: 18, ...shadow.card },
  title: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.ink2, fontFamily: typography.ko, fontSize: 13, marginTop: 7 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: '#EFECFA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 12,
  },
  badgeText: { color: colors.accent, fontFamily: typography.ko, fontSize: 12 },
  empty: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 80,
  },
});
