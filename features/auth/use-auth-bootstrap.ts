import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/store';
import { supabase } from '@/lib/supabase/client';

export function useAuthBootstrap() {
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setHydrated(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => data.subscription.unsubscribe();
  }, [setHydrated, setSession]);
}
