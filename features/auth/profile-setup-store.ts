import { create } from 'zustand';

type ProfileSetupState = {
  region: string;
  setRegion: (region: string) => void;
  reset: () => void;
};

export const useProfileSetupStore = create<ProfileSetupState>((set) => ({
  region: '',
  setRegion: (region) => set({ region }),
  reset: () => set({ region: '' }),
}));
