import { useRef } from 'react';
import { useAppStore } from '../store';
import { useResticEvent } from './useResticEvents';

interface ProgressPayload {
  run_id: string;
  message: any;
}

interface CompletePayload {
  run_id: string;
  exit_code: number;
  cancelled: boolean;
  snapshot_id?: string;
  error_count?: number;
}

export function useBackupManager() {
  const { 
    activeRunId, 
    updateProgress, 
    addError, 
    setRunState, 
    errors,
    clearRun 
  } = useAppStore();

  const lastUpdateRef = useRef<number>(0);
  const THROTTLE_MS = 500;

  useResticEvent<ProgressPayload>('backup-progress', (payload) => {
    if (payload.run_id !== activeRunId) return;

    const msg = payload.message;
    if (!msg) return;

    if (msg.message_type === 'error') {
      addError(`${msg.item ? msg.item + ': ' : ''}${msg.error}`);
    } else if (msg.message_type === 'status' || msg.message_type === 'verbose_status') {
      const now = Date.now();
      if (now - lastUpdateRef.current > THROTTLE_MS) {
        updateProgress({
          percent_done: msg.percent_done,
          files_done: msg.files_done,
          total_files: msg.total_files,
          bytes_done: msg.bytes_done,
          total_bytes: msg.total_bytes,
          current_files: msg.current_files,
          bytes_per_second: msg.bytes_per_second,
        });
        lastUpdateRef.current = now;
      }
    } else if (msg.message_type === 'summary') {
      updateProgress({ percent_done: 1.0 });
    }
  });

  useResticEvent<CompletePayload>('backup-complete', (payload) => {
    if (payload.run_id !== activeRunId) return;

    if (payload.exit_code === 0 && !payload.cancelled) {
      setRunState('idle');
      clearRun();
    } else if (payload.cancelled) {
      setRunState('idle');
      clearRun();
    } else {
      const hasLockError = errors.some(err => 
        err.toLowerCase().includes('lock') || 
        err.toLowerCase().includes('locked by another process')
      );
      if (hasLockError) {
        setRunState('locked');
      } else {
        setRunState('failed');
      }
    }
  });
}
