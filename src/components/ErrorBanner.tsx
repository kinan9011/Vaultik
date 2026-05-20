import { useAppStore } from '../store';
import { unlockRepo } from '../lib/tauri';
import { IconAlert, IconLock } from './Icons';

export function ErrorBanner() {
  const { runState, errors, activeProfileId, clearRun } = useAppStore();

  if (runState !== 'failed' && runState !== 'locked') return null;

  const handleUnlock = async () => {
    if (!activeProfileId) return;
    try {
      await unlockRepo(activeProfileId);
      clearRun();
    } catch (err) {
      console.error("Failed to unlock repo", err);
    }
  };

  return (
    <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <IconAlert className="text-[#f87171] w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-[#f87171] mb-1">
            {runState === 'locked' ? 'Repository Locked' : 'Backup Failed'}
          </h3>
          
          <div className="text-sm text-[#f87171]/90 mb-4">
            {errors.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            ) : (
              <p>An unexpected error occurred during the backup process.</p>
            )}
          </div>

          {runState === 'locked' && (
            <button
              onClick={handleUnlock}
              className="flex items-center gap-2 px-4 py-2 bg-[#f87171] text-white rounded-md hover:bg-[#ef4444] transition-colors text-sm font-medium focus:outline-none"
            >
              <IconLock className="w-4 h-4" />
              Unlock Repository
            </button>
          )}

          {runState === 'failed' && (
            <button
              onClick={() => clearRun()}
              className="px-4 py-2 bg-[#f87171]/20 text-[#f87171] rounded-md hover:bg-[#f87171]/30 transition-colors text-sm font-medium focus:outline-none"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
