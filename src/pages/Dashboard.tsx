import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listProfiles, runBackup, cancelOperation, getResticVersion, togglePause } from "@/lib/tauri";
import type { ProfileSummary, BackupProgressEvent } from "@/lib/types";
import { useResticEvent } from "@/hooks/useResticEvents";
import ProgressBar, { formatBytes, formatDuration } from "@/components/ProgressBar";

function StatusBadge({ profile }: { profile: ProfileSummary }) {
  if (profile.paused) {
    return (
      <span className="w-2.5 h-2.5 rounded-full bg-text-muted opacity-50 flex-shrink-0" title="Paused" />
    );
  }
  if (profile.last_run_exit_code === null && profile.last_run_at === null) {
    return (
      <span className="w-2.5 h-2.5 rounded-full bg-text-muted flex-shrink-0" title="Never run" />
    );
  }
  if (profile.last_run_exit_code === 0) {
    return (
      <span className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" title="Healthy" />
    );
  }
  if (profile.last_run_exit_code === 3) {
    return (
      <span className="w-2.5 h-2.5 rounded-full bg-warning flex-shrink-0" title="Completed with warnings" />
    );
  }
  return (
    <span className="w-2.5 h-2.5 rounded-full bg-error flex-shrink-0" title="Last run failed" />
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActiveRun {
  runId: string;
  profileId: string;
  percentDone: number;
  filesDone: number;
  totalFiles: number;
  bytesDone: number;
  totalBytes: number;
  secondsRemaining: number;
  currentFiles: string[];
  errorCount: number;
  completed: boolean;
  exitCode: number | null;
  filesNew: number;
  dataAdded: number;
}

export default function Dashboard() {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [resticVersion, setResticVersion] = useState<string>("");
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadProfiles = useCallback(() => {
    listProfiles().then(setProfiles).catch(() => {});
  }, []);

  useEffect(() => {
    loadProfiles();
    getResticVersion().then(setResticVersion).catch(() =>
      setResticVersion("restic not found"),
    );
  }, [loadProfiles]);

  useResticEvent<BackupProgressEvent>("backup-progress", (event) => {
    if (!activeRun || event.run_id !== activeRun.runId) return;
    const msg = event.message;
    if (msg.message_type === "status") {
      setActiveRun((prev) =>
        prev
          ? {
              ...prev,
              percentDone: msg.percent_done,
              filesDone: msg.files_done,
              totalFiles: msg.total_files,
              bytesDone: msg.bytes_done,
              totalBytes: msg.total_bytes,
              secondsRemaining: msg.seconds_remaining,
              currentFiles: msg.current_files,
              errorCount: msg.error_count,
            }
          : null,
      );
    } else if (msg.message_type === "summary") {
      setActiveRun((prev) =>
        prev
          ? { ...prev, filesNew: msg.files_new, dataAdded: msg.data_added }
          : null,
      );
    }
  });

  useResticEvent<{
    run_id: string;
    exit_code: number;
    cancelled: boolean;
    files_new?: number;
    data_added?: number;
    error_count?: number;
  }>("backup-complete", (event) => {
    if (!activeRun || event.run_id !== activeRun.runId) return;
    setActiveRun((prev) =>
      prev ? { ...prev, completed: true, exitCode: event.exit_code } : null,
    );
    // Clear after delay and refresh profiles
    setTimeout(() => {
      setActiveRun(null);
      loadProfiles();
    }, 4000);
  });

  async function handleRunBackup(profileId: string) {
    setError(null);
    try {
      const runId = await runBackup(profileId);
      setActiveRun({
        runId,
        profileId,
        percentDone: 0,
        filesDone: 0,
        totalFiles: 0,
        bytesDone: 0,
        totalBytes: 0,
        secondsRemaining: 0,
        currentFiles: [],
        errorCount: 0,
        completed: false,
        exitCode: null,
        filesNew: 0,
        dataAdded: 0,
      });
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleCancel() {
    if (activeRun) {
      await cancelOperation(activeRun.runId);
    }
  }

  async function handleTogglePause(profileId: string) {
    try {
      await togglePause(profileId);
      loadProfiles();
    } catch (e) {
      setError(String(e));
    }
  }

  const healthyCount = profiles.filter((p) => p.last_run_exit_code === 0 && !p.paused).length;
  const failedCount = profiles.filter(
    (p) => p.last_run_exit_code !== null && p.last_run_exit_code !== 0 && p.last_run_exit_code !== 3,
  ).length;
  const neverRun = profiles.filter((p) => p.last_run_at === null).length;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-text-secondary text-sm mt-1">
            {resticVersion || "Detecting restic..."}
          </p>
        </div>
        <button
          onClick={() => navigate("/profiles/new")}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          New Profile
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      {/* Health summary */}
      {profiles.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-bg-secondary border border-border rounded-lg">
            <p className="text-2xl font-semibold text-success">{healthyCount}</p>
            <p className="text-xs text-text-muted mt-1">Healthy</p>
          </div>
          <div className="p-4 bg-bg-secondary border border-border rounded-lg">
            <p className="text-2xl font-semibold text-error">{failedCount}</p>
            <p className="text-xs text-text-muted mt-1">Failed</p>
          </div>
          <div className="p-4 bg-bg-secondary border border-border rounded-lg">
            <p className="text-2xl font-semibold text-text-muted">{neverRun}</p>
            <p className="text-xs text-text-muted mt-1">Never run</p>
          </div>
        </div>
      )}

      {/* Active backup progress */}
      {activeRun && !activeRun.completed && (
        <div className="mb-6 p-5 bg-bg-secondary border border-accent/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Backup in progress...
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">
                {Math.round(activeRun.percentDone * 100)}%
              </span>
              <button
                onClick={handleCancel}
                className="px-2 py-1 text-xs text-error border border-error/30 rounded hover:bg-error/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          <ProgressBar percent={activeRun.percentDone} />
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-muted">
            <span>
              {activeRun.filesDone.toLocaleString()} / {activeRun.totalFiles.toLocaleString()} files
            </span>
            <span>
              {formatBytes(activeRun.bytesDone)} / {formatBytes(activeRun.totalBytes)}
            </span>
            {activeRun.secondsRemaining > 0 && (
              <span>~{formatDuration(activeRun.secondsRemaining)} remaining</span>
            )}
            {activeRun.errorCount > 0 && (
              <span className="text-warning">{activeRun.errorCount} errors</span>
            )}
          </div>
          {activeRun.currentFiles.length > 0 && (
            <p className="mt-2 text-xs text-text-muted font-mono truncate">
              {activeRun.currentFiles[0]}
            </p>
          )}
        </div>
      )}

      {/* Completed summary */}
      {activeRun?.completed && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm border ${
            activeRun.exitCode === 0
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          {activeRun.exitCode === 0
            ? `Backup completed — ${activeRun.filesNew} new files, ${formatBytes(activeRun.dataAdded)} added`
            : `Backup failed (exit code ${activeRun.exitCode})`}
        </div>
      )}

      {/* Profile cards */}
      {profiles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg mb-2">
            No backup profiles configured
          </p>
          <p className="text-text-muted text-sm mb-6">
            Create a profile to start backing up your data
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/wizard")}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
            >
              Setup Wizard
            </button>
            <button
              onClick={() => navigate("/profiles/new")}
              className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-bg-tertiary transition-colors"
            >
              Manual Setup
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`p-5 bg-bg-secondary border border-border rounded-lg hover:border-accent/40 transition-colors ${profile.paused ? "opacity-70" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <StatusBadge profile={profile} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/profiles/${profile.id}`)}
                        className="text-base font-medium hover:text-accent transition-colors text-left"
                      >
                        {profile.name}
                      </button>
                      {profile.paused && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-text-muted/20 text-text-muted uppercase">
                          paused
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted truncate">
                      {profile.repo_url}
                    </p>
                    <div className="flex gap-4 mt-1.5 text-xs text-text-muted">
                      <span>
                        {profile.source_count} source{profile.source_count !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {profile.has_schedule ? "Scheduled" : "Manual"}
                      </span>
                      {profile.last_run_at && (
                        <span>{timeAgo(profile.last_run_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleTogglePause(profile.id)}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
                    title={profile.paused ? "Resume profile" : "Pause profile"}
                  >
                    {profile.paused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={() => navigate(`/snapshots/${profile.id}`)}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
                  >
                    Snapshots
                  </button>
                  <button
                    onClick={() => handleRunBackup(profile.id)}
                    disabled={(activeRun !== null && !activeRun.completed) || profile.paused}
                    className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    Run Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
