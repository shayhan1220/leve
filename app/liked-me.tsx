import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfilePhoto } from '@/components/profile-photo';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useWhoLikedMe } from '@/features/discovery/hooks';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function LikedMeScreen() {
  const liked = useWhoLikedMe();

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          나를 좋아한 사람
        </Text>
      </View>

      {liked.data?.revealed ? (
        <View style={styles.grid}>
          {liked.data.people.map((person) => (
            <Pressable
              key={person.user_id}
              onPress={() => router.push(`/profile/${person.user_id}`)}
              style={styles.person}
            >
              <ProfilePhoto label={person.nickname} path={person.photo_path} style={styles.photo} />
              <Text style={styles.name}>
                {person.nickname ?? '이름 비공개'}
                {person.age ? `, ${person.age}` : ''}
              </Text>
              <Text style={styles.region}>{person.region ?? '지역 비공개'}</Text>
              {person.type === 'super' ? <Text style={styles.super}>슈퍼라이크</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.locked}>
          <View style={styles.blurCards}>
            {[0, 1, 2, 3].map((item) => (
              <View key={item} style={styles.blurCard}>
                <View style={styles.blurCircle} />
                <View style={styles.blurLine} />
              </View>
            ))}
          </View>
          <Text style={styles.lockTitle}>{liked.data?.count ?? 0}명이 좋아요를 보냈어요</Text>
          <Text style={styles.lockBody}>Léve Plus를 시작하면 프로필을 바로 확인할 수 있어요.</Text>
          <Button
            label="Léve Plus 알아보기"
            onPress={() => router.push('/paywall/plus')}
            style={styles.plusButton}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 20 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 32 },
  title: { color: colors.ink, fontFamily: typography.ko, fontSize: 20, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  person: {
    width: '48%',
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingBottom: 14,
  },
  photo: { width: '100%', aspectRatio: 0.86 },
  name: {
    marginTop: 10,
    marginHorizontal: 12,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 15,
    fontWeight: '700',
  },
  region: {
    marginTop: 2,
    marginHorizontal: 12,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 12,
  },
  super: {
    marginTop: 6,
    marginHorizontal: 12,
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 11,
    fontWeight: '700',
  },
  locked: { alignItems: 'center', paddingTop: spacing.xl },
  blurCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, opacity: 0.45 },
  blurCard: {
    width: '47%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: '#D9D5E4',
  },
  blurCircle: { width: 74, height: 74, borderRadius: radius.pill, backgroundColor: '#AAA4BA' },
  blurLine: { width: 72, height: 12, borderRadius: 6, backgroundColor: '#AAA4BA', marginTop: 14 },
  lockTitle: {
    marginTop: spacing.xl,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 20,
    fontWeight: '700',
  },
  lockBody: {
    marginTop: spacing.sm,
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    textAlign: 'center',
  },
  plusButton: { width: '100%', marginTop: spacing.lg },
});
