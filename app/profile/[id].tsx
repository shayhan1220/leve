import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfilePhoto } from '@/components/profile-photo';
import { Screen } from '@/components/ui/screen';
import { useProfileDetail } from '@/features/discovery/hooks';
import { clanPresentation } from '@/features/lovedna/presentation';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useProfileDetail(id);
  const data = detail.data;

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>프로필</Text>
        <Pressable style={styles.more}>
          <Text style={styles.moreText}>•••</Text>
        </Pressable>
      </View>

      {data ? (
        <>
          <ProfilePhoto
            label={data.profile.nickname}
            path={data.photos[0]?.storage_path}
            style={styles.hero}
          />
          <View style={styles.identity}>
            <Text accessibilityRole="header" style={styles.name}>
              {data.profile.nickname ?? '이름 비공개'}
              {data.profile.age ? `, ${data.profile.age}` : ''}
            </Text>
            <Text style={styles.region}>{data.profile.region ?? '지역 비공개'}</Text>
            <View style={styles.badges}>
              {data.badges.map((badge) => (
                <View key={badge} style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badge === 'female_safe'
                      ? '여성 인증'
                      : badge === 'job'
                        ? '직업 인증'
                        : badge === 'vip'
                          ? 'Premium'
                          : '본인 인증'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Section title="소개">
            <Text style={styles.body}>{data.profile.bio || '소개를 작성하고 있어요.'}</Text>
          </Section>
          <Section title="찾고 있는 관계">
            <View style={styles.tags}>
              {data.profile.looking_for.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </Section>
          {data.love_dna ? (
            <Section title="Love DNA">
              <Text style={styles.dnaClan}>
                {data.love_dna.clan} · {clanPresentation[data.love_dna.clan].korean}
              </Text>
              <Text style={styles.body}>{clanPresentation[data.love_dna.clan].tagline}</Text>
            </Section>
          ) : null}
        </>
      ) : detail.isLoading ? (
        <Text style={styles.state}>프로필을 불러오고 있어요.</Text>
      ) : (
        <Text style={styles.state}>프로필을 확인할 수 없어요.</Text>
      )}
    </Screen>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 32 },
  headerTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 18, fontWeight: '700' },
  more: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  moreText: { color: colors.ink2, fontSize: 18 },
  hero: { width: '100%', aspectRatio: 0.9, borderRadius: 28 },
  identity: { paddingVertical: spacing.lg },
  name: { color: colors.ink, fontFamily: typography.ko, fontSize: 25, fontWeight: '700' },
  region: { marginTop: 4, color: colors.ink2, fontFamily: typography.ko, fontSize: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: {
    borderRadius: radius.pill,
    backgroundColor: '#E5F3EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: colors.teal, fontFamily: typography.ko, fontSize: 11, fontWeight: '700' },
  section: { borderTopWidth: 1, borderTopColor: colors.hairline, paddingVertical: spacing.lg },
  sectionTitle: {
    marginBottom: 10,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    fontWeight: '700',
  },
  body: { color: colors.ink2, fontFamily: typography.ko, fontSize: 14, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderRadius: radius.pill,
    backgroundColor: '#EFECF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tagText: { color: colors.accent, fontFamily: typography.ko, fontSize: 12, fontWeight: '500' },
  dnaClan: {
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  state: {
    marginTop: spacing.xl,
    color: colors.ink2,
    fontFamily: typography.ko,
    textAlign: 'center',
  },
});
