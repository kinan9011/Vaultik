import { create } from 'zustand';
import { ProfileSummary } from '../lib/types';
import { listProfiles } from '../lib/tauri';

interface AppState {
  profiles: ProfileSummary[];
  loading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  profiles: [],
  loading: false,
  error: null,
  fetchProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const data = await listProfiles();
      set({ profiles: data, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },
}));
