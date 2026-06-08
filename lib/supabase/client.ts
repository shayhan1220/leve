import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import { env } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';

const isWebServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      ...(isWebServer ? {} : { storage: AsyncStorage }),
      autoRefreshToken: !isWebServer,
      persistSession: !isWebServer,
      detectSessionInUrl: Platform.OS === 'web' && !isWebServer,
    },
  },
);

if (Platform.OS !== 'web' && !isWebServer) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
