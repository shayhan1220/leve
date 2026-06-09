import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { Screen } from '@/components/ui/screen';
import { useCommunityFeed } from '@/features/community/hooks';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function GroupsScreen() {
  const feed = useCommunityFeed();
  return (
    <Screen scroll style={styles.screen}>
      <AppHeader title="그룹" />
      <View style={styles.list}>
        {feed.data?.groups.map((group) => (
          <Pressable
            key={group.id}
            onPress={() => router.push(`/group/${group.id}`)}
            style={styles.card}
          >
            <View style={[styles.art, group.is_queer && styles.artQueer]} />
            <View style={styles.copy}>
              <Text style={styles.name}>{group.name}</Text>
              <Text numberOfLines={2} style={styles.description}>
                {group.description}
              </Text>
              <Text style={styles.meta}>멤버 {group.member_count}명</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0 },
  list: { gap: 12, paddingVertical: spacing.md },
  card: {
    flexDirection: 'row',
    gap: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadow.card,
  },
  art: { width: 80, height: 80, borderRadius: 22, backgroundColor: '#75B5AA' },
  artQueer: { backgroundColor: '#D09AB4' },
  copy: { flex: 1, gap: 5 },
  name: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  description: { color: colors.ink2, fontFamily: typography.ko, fontSize: 13, lineHeight: 19 },
  meta: { color: colors.accent, fontFamily: typography.ko, fontSize: 12 },
});
