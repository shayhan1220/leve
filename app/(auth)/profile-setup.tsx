import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Body, Title } from '@/components/ui/typography';
import { profileSetupSchema, saveProfileSetup, uploadProfilePhoto } from '@/features/auth/api';
import { useProfileSetupStore } from '@/features/auth/profile-setup-store';
import { useAuthStore } from '@/features/auth/store';
import { useVerification } from '@/features/auth/use-verification';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type SelectedPhoto = {
  uri: string;
  mimeType: string | null;
};

export default function ProfileSetupScreen() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const verification = useVerification(session?.user.id);
  const region = useProfileSetupStore((state) => state.region);
  const resetSetup = useProfileSetupStore((state) => state.reset);
  const [nickname, setNickname] = useState('');
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session) router.replace('/(auth)/signup');
  }, [session]);

  useEffect(() => {
    if (
      !verification.isLoading &&
      (!verification.data?.is_verified || verification.data.is_female !== true)
    ) {
      router.replace('/(auth)/verify');
    }
  }, [verification.data, verification.isLoading]);

  async function selectPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        '사진 접근 권한이 필요해요',
        '프로필 사진을 선택하려면 사진 접근을 허용해 주세요.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 0.86,
    });
    if (result.canceled) return;

    setPhotos(
      result.assets.slice(0, 3).map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
      })),
    );
  }

  async function submit() {
    if (!session) return;

    try {
      const input = profileSetupSchema.parse({ nickname, region });
      setPending(true);
      await Promise.all(
        photos.map((photo, index) => uploadProfilePhoto(session.user.id, photo, index)),
      );
      await saveProfileSetup(session.user.id, input);
      await queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] });
      resetSetup();
      router.replace('/(onboarding)/lovedna/intro');
    } catch (error) {
      Alert.alert(
        '프로필을 저장하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setPending(false);
    }
  }

  const parsed = profileSetupSchema.safeParse({ nickname, region });

  return (
    <OnboardingShell
      scroll
      step={3}
      footer={
        <Button
          label={pending ? '저장 중...' : '다음'}
          disabled={pending || !parsed.success || photos.length === 0}
          onPress={submit}
        />
      }
    >
      <Title>프로필을{'\n'}만들어 볼까요?</Title>
      <Body style={styles.description}>나를 잘 보여주는 사진과 정보를 알려 주세요.</Body>

      <Text style={styles.sectionLabel}>프로필 사진</Text>
      <Pressable
        accessibilityHint="최대 3장의 프로필 사진을 선택합니다"
        accessibilityLabel="프로필 사진 선택"
        accessibilityRole="button"
        onPress={selectPhotos}
        style={styles.photos}
      >
        {[0, 1, 2].map((index) => {
          const photo = photos[index];
          return (
            <View key={index} style={[styles.photo, index === 0 && styles.primaryPhoto]}>
              {photo ? (
                <Image contentFit="cover" source={photo.uri} style={styles.photoImage} />
              ) : (
                <>
                  <Text style={styles.plus}>+</Text>
                  {index === 0 ? <Text style={styles.photoCaption}>대표 사진</Text> : null}
                </>
              )}
            </View>
          );
        })}
      </Pressable>

      <View style={styles.fields}>
        <FormField
          accessibilityLabel="닉네임"
          autoCapitalize="none"
          label="닉네임"
          maxLength={12}
          placeholder="2~12자로 입력해 주세요"
          value={nickname}
          onChangeText={setNickname}
        />

        <View style={styles.group}>
          <Text style={styles.fieldLabel}>지역</Text>
          <Pressable
            accessibilityLabel="지역 선택"
            accessibilityRole="button"
            onPress={() => router.push('/region')}
            style={styles.selector}
          >
            <Text style={region ? styles.selectorValue : styles.selectorPlaceholder}>
              {region || '활동 지역을 선택해 주세요'}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <FormField
          editable={false}
          label="나이"
          trailing={<Text style={styles.verified}>인증 완료</Text>}
          value={
            verification.data?.age === null || verification.data?.age === undefined
              ? ''
              : `만 ${verification.data.age}세`
          }
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: spacing.md },
  sectionLabel: {
    marginTop: 34,
    marginBottom: 10,
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '600',
  },
  photos: { flexDirection: 'row', gap: 12 },
  photo: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
  },
  primaryPhoto: { borderStyle: 'dashed', borderColor: colors.accent },
  photoImage: { width: '100%', height: '100%' },
  plus: { color: colors.accent, fontSize: 27, lineHeight: 30 },
  photoCaption: {
    color: colors.accent,
    fontFamily: typography.ko,
    fontSize: 10,
    fontWeight: '600',
  },
  fields: { marginTop: 30, gap: 20 },
  group: { gap: 8 },
  fieldLabel: {
    color: colors.ink,
    fontFamily: typography.ko,
    fontSize: 14,
    fontWeight: '600',
  },
  selector: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  selectorValue: { flex: 1, color: colors.ink, fontFamily: typography.ko, fontSize: 16 },
  selectorPlaceholder: {
    flex: 1,
    color: '#AAA8B2',
    fontFamily: typography.ko,
    fontSize: 16,
  },
  chevron: { color: colors.ink2, fontSize: 28, lineHeight: 30 },
  verified: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: '#DDF1EC',
    color: colors.teal,
    fontFamily: typography.ko,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
