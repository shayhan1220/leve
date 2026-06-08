import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthState = {
  hydrated: boolean;
  session: Session | null;
  setHydrated: (hydrated: boolean) => void;
  setSession: (session: Session | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  session: null,
  setHydrated: (hydrated) => set({ hydrated }),
  setSession: (session) => set({ session }),
}));
