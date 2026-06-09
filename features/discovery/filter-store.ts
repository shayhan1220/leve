import { create } from 'zustand';

import type { DiscoverFilters } from '@/features/discovery/api';

type DiscoveryFilterState = {
  filters: DiscoverFilters;
  setFilters: (filters: DiscoverFilters) => void;
  reset: () => void;
};

const defaultFilters: DiscoverFilters = { limit: 20 };

export const useDiscoveryFilterStore = create<DiscoveryFilterState>((set) => ({
  filters: defaultFilters,
  setFilters: (filters) => set({ filters }),
  reset: () => set({ filters: defaultFilters }),
}));
