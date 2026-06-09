import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useCreateGroupPost, useGroup, useJoinGroup } from '@/features/community/hooks';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = useGroup(id);
  const join = useJoinGroup();
  const post = useCreateGroupPost(id ?? '');
  const [body, setBody] = useState('');
  const [joined, setJoined] = useState(false);

  async function joinGroup() {
    if (!id) return;
    try {
      await join.mutateAsync(id);
      setJoined(true);
    } catch (error) {
      Alert.alert(
        '가입하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  async function submitPost() {
    try {
      await post.mutateAsync(body);
      setBody('');
    } catch (error) {
      Alert.alert(
        '글을 등록하지 못했어요',
        error instanceof Error ? error.message : '먼저 그룹에 가입해 주세요.',
      );
    }
  }

  return (
    <Screen scroll style={styles.screen}>
      <AppHeader title="그룹 상세" />
      {group.data ? (
        <>
          <View style={[styles.hero, group.data.group.is_queer && styles.heroQueer]}>
            <Text style={styles.heroTitle}>{group.data.group.name}</Text>
            <Text style={styles.heroBody}>{group.data.group.description}</Text>
          </View>
          {!joined ? (
            <Button disabled={join.isPending} label="그룹 가입하기" onPress={joinGroup} />
          ) : null}
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="그룹 글 작성"
              multiline
              onChangeText={setBody}
              placeholder="멤버들과 이야기를 나눠보세요"
              placeholderTextColor="#9A9AA7"
              style={styles.input}
              value={body}
            />
            <Pressable
              disabled={!body.trim() || post.isPending}
              onPress={submitPost}
              style={styles.postButton}
            >
              <Text style={styles.postButtonText}>등록</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionTitle}>최근 이야기</Text>
          {group.data.posts.map((item) => (
            <View key={item.id} style={styles.post}>
              <Text style={styles.postBody}>{item.body}</Text>
              <Text style={styles.postMeta}>
                {new Date(item.created_at).toLocaleDateString('ko-KR')}
              </Text>
            </View>
          ))}
          {!group.data.posts.length ? (
            <Text style={styles.empty}>첫 이야기를 남겨보세요.</Text>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0, gap: spacing.md },
  hero: {
    minHeight: 190,
    justifyContent: 'flex-end',
    borderRadius: 28,
    backgroundColor: '#68AFA3',
    padding: 24,
    ...shadow.card,
  },
  heroQueer: { backgroundColor: colors.rose },
  heroTitle: { color: colors.surface, fontFamily: typography.ko, fontSize: 24, fontWeight: '700' },
  heroBody: {
    color: colors.surface,
    fontFamily: typography.ko,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
  },
  composer: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadow.card,
  },
  input: {
    minHeight: 76,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  postButton: {
    minWidth: 64,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  postButtonText: {
    color: colors.surface,
    fontFamily: typography.ko,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: { color: colors.ink, fontFamily: typography.ko, fontSize: 16, fontWeight: '700' },
  post: { borderRadius: radius.card, backgroundColor: colors.surface, padding: 18, ...shadow.card },
  postBody: { color: colors.ink, fontFamily: typography.ko, fontSize: 14, lineHeight: 22 },
  postMeta: { color: colors.ink2, fontFamily: typography.ko, fontSize: 11, marginTop: 10 },
  empty: {
    color: colors.ink2,
    fontFamily: typography.ko,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 30,
  },
});
