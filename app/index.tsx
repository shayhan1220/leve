import { Redirect } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';
import { useProfile } from '@/features/auth/use-profile';
import { useVerification } from '@/features/auth/use-verification';
import { useLoveDna } from '@/features/lovedna/use-love-dna';

export default function Index() {
  const { hydrated, session } = useAuthStore();
  const verification = useVerification(session?.user.id);
  const profile = useProfile(session?.user.id);
  const profileReady = Boolean(profile.data?.nickname && profile.data.region);
  const loveDna = useLoveDna(Boolean(session && verification.data?.is_verified && profileReady));

  if (!hydrated) return null;
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
  return <Redirect href="/(tabs)/discover" />;
}
