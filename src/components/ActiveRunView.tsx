import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import ProgressBar, { formatBytes } from './ProgressBar';
import { IconChevronRight, IconChevronDown } from './Icons';

export function ActiveRunView() {
  const { runState, progressStats, logs } = useAppStore();
  const [showLogs, setShowLogs] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  useEffect(() => {
    if (runState !== 'running') {
      setIsIndeterminate(false);
      return;
    }

    const timer = setTimeout(() => {
      // If we haven't received progress updates (bytes_done could be our indicator, 
      // but we don't have a timestamp in progressStats).
      // A simple heuristic: if running for > 2s without percent_done changing, pulse.
      // Wait, without a last_updated timestamp in the store, we can just assume 
      // if percent_done is undefined or 0 after 2s, we show indeterminate.
      if (progressStats.percent_done === undefined || progressStats.percent_done === 0) {
        setIsIndeterminate(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [runState, progressStats.percent_done]);

  if (runState === 'idle' || runState === 'locked' || runState === 'failed') return null;

  const percent = progressStats.percent_done ?? 0;
  const filesDone = progressStats.files_done ?? 0;
  const totalFiles = progressStats.total_files ?? 0;
  const bytesDone = progressStats.bytes_done ?? 0;
  const totalBytes = progressStats.total_bytes ?? 0;

  return (
    <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Backup in Progress</h3>
          <p className="text-sm text-text-tertiary mt-1">
            {isIndeterminate 
              ? "Scanning repository..." 
              : `Processed ${filesDone} of ${totalFiles} files (${formatBytes(bytesDone)} / ${formatBytes(totalBytes)})`}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-semibold text-accent">
            {isIndeterminate ? "..." : `${Math.round(percent * 100)}%`}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <ProgressBar 
          percent={percent} 
          className={isIndeterminate ? "animate-pulse" : ""} 
        />
      </div>

      <div>
        <button 
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
        >
          {showLogs ? <IconChevronDown className="mr-1" /> : <IconChevronRight className="mr-1" />}
          Advanced Details
        </button>

        {showLogs && (
          <div className="mt-3 bg-bg-primary rounded-md p-3 max-h-48 overflow-y-auto border border-border-light">
            {logs.length === 0 ? (
              <span className="text-text-tertiary text-xs">Waiting for logs...</span>
            ) : (
              <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">
                {logs.join('\n')}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
