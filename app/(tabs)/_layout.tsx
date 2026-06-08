import { Redirect, Tabs } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';
import { useProfile } from '@/features/auth/use-profile';
import { useVerification } from '@/features/auth/use-verification';
import { useLoveDna } from '@/features/lovedna/use-love-dna';
import { colors } from '@/theme/tokens';

const tabs = [
  ['discover', '탐색'],
  ['community', '커뮤니티'],
  ['matches', '매칭'],
  ['chat', '대화'],
  ['queer', '퀴어'],
  ['my', '마이'],
] as const;

export default function TabsLayout() {
  const session = useAuthStore((state) => state.session);
  const verification = useVerification(session?.user.id);
  const profile = useProfile(session?.user.id);
  const profileReady = Boolean(profile.data?.nickname && profile.data.region);
  const loveDna = useLoveDna(Boolean(session && verification.data?.is_verified && profileReady));

  if (!session) return <Redirect href="/(auth)/signup" />;
  if (verification.isLoading) return null;
  if (!verification.data?.is_verified || verification.data.is_female !== true) {
    return <Redirect href="/(auth)/verify" />;
  }
  if (profile.isLoading) return null;
  if (!profile.data?.nickname || !profile.data.region) {
    return <Redirect href="/(auth)/profile-setup" />;
  }
  if (loveDna.isLoading) return null;
  if (!loveDna.data) return <Redirect href="/(onboarding)/lovedna/intro" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent }}>
      {tabs.map(([name, title]) => (
        <Tabs.Screen key={name} name={name} options={{ title }} />
      ))}
    </Tabs>
  );
}
