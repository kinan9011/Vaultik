import { useEffect, useState } from "react";
import { getRunHistory, listProfiles } from "@/lib/tauri";
import type { RunRecord, ProfileSummary } from "@/lib/types";
import { formatBytes, formatDuration } from "@/components/ProgressBar";

function StatusBadge({ exitCode }: { exitCode: number | null }) {
  if (exitCode === null)
    return <span className="px-2 py-0.5 text-xs rounded bg-accent/15 text-accent">running</span>;
  if (exitCode === 0)
    return <span className="px-2 py-0.5 text-xs rounded bg-success/15 text-success">success</span>;
  if (exitCode === 3)
    return <span className="px-2 py-0.5 text-xs rounded bg-warning/15 text-warning">partial</span>;
  return <span className="px-2 py-0.5 text-xs rounded bg-error/15 text-error">failed</span>;
}

function parseSummary(json: string | null) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function RunHistory() {
  const [records, setRecords] = useState<RunRecord[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filterProfile, setFilterProfile] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      getRunHistory(undefined, 200),
      listProfiles(),
    ]).then(([records, profs]) => {
      setRecords(records);
      const map = new Map<string, string>();
      profs.forEach((p: ProfileSummary) => map.set(p.id, p.name));
      setProfiles(map);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterProfile
    ? records.filter((r) => r.profile_id === filterProfile)
    : records;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString();
  }

  function duration(r: RunRecord): string {
    if (!r.finished_at) return "-";
    const ms = new Date(r.finished_at).getTime() - new Date(r.started_at).getTime();
    return formatDuration(ms / 1000);
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Run History</h2>
        {profiles.size > 0 && (
          <select
            value={filterProfile}
            onChange={(e) => setFilterProfile(e.target.value)}
            className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-sm text-text"
          >
            <option value="">All profiles</option>
            {Array.from(profiles.entries()).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-text-muted text-center py-12">
          No runs recorded yet. Run a backup to see history here.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const summary = parseSummary(r.summary);
            const isExpanded = expandedId === r.id;

            return (
              <div key={r.id} className="bg-bg-secondary border border-border rounded-lg">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge exitCode={r.exit_code} />
                      <span className="text-sm font-medium">{r.operation}</span>
                      <span className="text-xs text-text-muted">
                        {profiles.get(r.profile_id) || r.profile_id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-text-muted">
                        via {r.trigger}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">{duration(r)}</span>
                      <span className="text-xs text-text-muted">
                        {formatTime(r.started_at)}
                      </span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                    {r.snapshot_id && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-text-muted">Snapshot:</span>
                        <span className="font-mono">{r.snapshot_id}</span>
                      </div>
                    )}
                    {r.finished_at && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-text-muted">Finished:</span>
                        <span>{formatTime(r.finished_at)}</span>
                      </div>
                    )}
                    {summary && (
                      <div className="grid grid-cols-3 gap-2 mt-2 p-3 bg-bg-tertiary rounded text-xs">
                        {summary.files_new !== undefined && (
                          <div>
                            <span className="text-text-muted">Files new: </span>
                            <span>{summary.files_new}</span>
                          </div>
                        )}
                        {summary.files_changed !== undefined && (
                          <div>
                            <span className="text-text-muted">Changed: </span>
                            <span>{summary.files_changed}</span>
                          </div>
                        )}
                        {summary.files_unmodified !== undefined && (
                          <div>
                            <span className="text-text-muted">Unchanged: </span>
                            <span>{summary.files_unmodified}</span>
                          </div>
                        )}
                        {summary.data_added !== undefined && (
                          <div>
                            <span className="text-text-muted">Added: </span>
                            <span>{formatBytes(summary.data_added)}</span>
                          </div>
                        )}
                        {summary.total_duration !== undefined && (
                          <div>
                            <span className="text-text-muted">Duration: </span>
                            <span>{formatDuration(summary.total_duration)}</span>
                          </div>
                        )}
                        {summary.total_files_processed !== undefined && (
                          <div>
                            <span className="text-text-muted">Total files: </span>
                            <span>{summary.total_files_processed.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {r.errors && (
                      <div className="mt-2 p-3 bg-error/5 rounded text-xs text-error">
                        <span className="font-medium">Errors: </span>
                        {r.errors}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
