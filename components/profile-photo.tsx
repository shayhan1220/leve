import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useProfilePhoto } from '@/features/discovery/hooks';
import { colors, typography } from '@/theme/tokens';

export function ProfilePhoto({
  path,
  style,
  label,
}: {
  path: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  label?: string | null;
}) {
  const photo = useProfilePhoto(path);

  return (
    <View style={[styles.placeholder, style]}>
      {photo.data ? (
        <Image
          accessibilityLabel={`${label ?? '프로필'} 사진`}
          contentFit="cover"
          source={photo.data}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Text style={styles.initial}>{label?.trim().slice(0, 1) || 'L'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#D9D1EB',
  },
  initial: {
    color: colors.surface,
    fontFamily: typography.display,
    fontSize: 38,
    fontWeight: '600',
  },
});
