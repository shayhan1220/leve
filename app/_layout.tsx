import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { useAuthBootstrap } from '@/features/auth/use-auth-bootstrap';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  useAuthBootstrap();

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen
          name="date-proposal"
          options={{
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
            presentation: 'transparentModal',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
