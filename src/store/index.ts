import { create } from 'zustand';
import { ProfileSummary } from '../lib/types';
import { listProfiles } from '../lib/tauri';

export interface ProgressStats {
  percent_done?: number;
  files_done?: number;
  total_files?: number;
  bytes_done?: number;
  total_bytes?: number;
  current_files?: string[];
  bytes_per_second?: number;
}

export type RunState = 'idle' | 'running' | 'locked' | 'failed';

interface AppState {
  profiles: ProfileSummary[];
  loading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<void>;

  activeProfileId: string | null;
  activeRunId: string | null;
  runState: RunState;
  progressStats: ProgressStats;
  logs: string[];
  errors: string[];

  startRun: (runId: string, profileId: string) => void;
  updateProgress: (stats: Partial<ProgressStats>) => void;
  addLog: (log: string) => void;
  addError: (error: string) => void;
  setRunState: (state: RunState) => void;
  clearRun: () => void;
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

  activeProfileId: null,
  activeRunId: null,
  runState: 'idle',
  progressStats: {},
  logs: [],
  errors: [],

  startRun: (runId, profileId) => 
    set({ 
      activeRunId: runId, 
      activeProfileId: profileId, 
      runState: 'running', 
      progressStats: {}, 
      logs: [], 
      errors: [] 
    }),
  updateProgress: (stats) => 
    set((state) => ({ progressStats: { ...state.progressStats, ...stats } })),
  addLog: (log) => 
    set((state) => ({ logs: [...state.logs, log] })),
  addError: (error) => 
    set((state) => ({ errors: [...state.errors, error] })),
  setRunState: (runState) => 
    set({ runState }),
  clearRun: () => 
    set({ 
      activeRunId: null, 
      activeProfileId: null, 
      runState: 'idle', 
      progressStats: {}, 
      logs: [], 
      errors: [] 
    }),
}));
