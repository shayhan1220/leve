import { Redirect } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';

export default function Index() {
  const { hydrated, session } = useAuthStore();
  if (!hydrated) return <Redirect href="/splash" />;
  return <Redirect href={session ? '/(tabs)/discover' : '/(auth)/signup'} />;
}
