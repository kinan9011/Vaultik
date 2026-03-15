import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  listSnapshots,
  browseSnapshot,
  forgetSnapshots,
  runRestore,
  cancelOperation,
} from "@/lib/tauri";
import type { Snapshot, LsNode, RestoreProgressEvent } from "@/lib/types";
import { useResticEvent } from "@/hooks/useResticEvents";
import ProgressBar, { formatBytes } from "@/components/ProgressBar";

// ── Restore Dialog ──────────────────────────────────────────────────────────

interface RestoreDialogProps {
  profileId: string;
  snapshot: Snapshot;
  selectedPaths: string[];
  onClose: () => void;
}

function RestoreDialog({ profileId, snapshot, selectedPaths, onClose }: RestoreDialogProps) {
  const [target, setTarget] = useState("");
  const [verify, setVerify] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    percentDone: number;
    filesRestored: number;
    totalFiles: number;
    bytesRestored: number;
    totalBytes: number;
  } | null>(null);
  const [completed, setCompleted] = useState<{ exitCode: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useResticEvent<RestoreProgressEvent>("restore-progress", (event) => {
    if (!runId || event.run_id !== runId) return;
    const msg = event.message;
    if (msg.message_type === "status") {
      setProgress({
        percentDone: msg.percent_done,
        filesRestored: msg.files_restored,
        totalFiles: msg.total_files,
        bytesRestored: msg.bytes_restored,
        totalBytes: msg.total_bytes,
      });
    }
  });

  useResticEvent<{ run_id: string; exit_code: number }>("restore-complete", (event) => {
    if (!runId || event.run_id !== runId) return;
    setCompleted({ exitCode: event.exit_code });
  });

  async function handleStart() {
    if (!target.trim()) {
      setError("Please specify a target directory");
      return;
    }
    setError(null);
    try {
      const id = await runRestore(
        profileId,
        snapshot.id!,
        target,
        selectedPaths,
        [],
        verify,
      );
      setRunId(id);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleCancel() {
    if (runId) await cancelOperation(runId);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-xl w-[520px] max-h-[80vh] overflow-auto shadow-xl">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold">Restore Files</h3>
          <p className="text-xs text-text-muted mt-1">
            From snapshot {snapshot.short_id || snapshot.id?.slice(0, 8)} &middot;{" "}
            {selectedPaths.length > 0
              ? `${selectedPaths.length} path${selectedPaths.length > 1 ? "s" : ""} selected`
              : "All files"}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          {completed ? (
            <div
              className={`p-4 rounded-lg text-sm border ${
                completed.exitCode === 0
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-error/10 border-error/30 text-error"
              }`}
            >
              {completed.exitCode === 0
                ? `Restore completed — ${progress?.filesRestored ?? 0} files restored`
                : `Restore failed (exit code ${completed.exitCode})`}
            </div>
          ) : runId ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Restoring...</span>
                <span className="text-sm text-text-secondary">
                  {Math.round((progress?.percentDone ?? 0) * 100)}%
                </span>
              </div>
              <ProgressBar percent={progress?.percentDone ?? 0} />
              <div className="flex gap-4 text-xs text-text-muted">
                <span>
                  {(progress?.filesRestored ?? 0).toLocaleString()} / {(progress?.totalFiles ?? 0).toLocaleString()} files
                </span>
                <span>
                  {formatBytes(progress?.bytesRestored ?? 0)} / {formatBytes(progress?.totalBytes ?? 0)}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Restore to directory
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="/home/user/restored"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                />
              </div>
              {selectedPaths.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Selected paths
                  </label>
                  <div className="max-h-24 overflow-auto space-y-1">
                    {selectedPaths.map((p, i) => (
                      <p key={i} className="text-xs font-mono text-text-secondary truncate">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={verify}
                  onChange={(e) => setVerify(e.target.checked)}
                  className="rounded"
                />
                Verify restored files after completion
              </label>
            </>
          )}
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-2">
          {completed ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm transition-colors"
            >
              Done
            </button>
          ) : runId ? (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-error border border-error/30 rounded-lg hover:bg-error/10 transition-colors"
            >
              Cancel Restore
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                Start Restore
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── File Tree ───────────────────────────────────────────────────────────────

interface TreeNode {
  name: string;
  path: string;
  nodeType: string;
  size: number | null;
  mtime: string | null;
  children: TreeNode[];
  loaded: boolean;
}

function buildTree(nodes: LsNode[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  for (const node of nodes) {
    const treeNode: TreeNode = {
      name: node.name,
      path: node.path || node.name,
      nodeType: node.node_type,
      size: node.size ?? null,
      mtime: node.mtime ?? null,
      children: [],
      loaded: true,
    };

    map.set(treeNode.path, treeNode);

    const parentPath = treeNode.path.replace(/\/[^/]+$/, "");
    const parent = map.get(parentPath);
    if (parent) {
      parent.children.push(treeNode);
    } else {
      root.push(treeNode);
    }
  }

  return root;
}

function FileTreeRow({
  node,
  depth,
  expanded,
  onToggle,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  selected: Set<string>;
  onSelect: (path: string) => void;
}) {
  const isDir = node.nodeType === "dir";
  const isExpanded = expanded.has(node.path);

  return (
    <>
      <tr className="border-b border-border/30 hover:bg-bg-secondary/50">
        <td className="py-1.5 pr-2" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.has(node.path)}
              onChange={() => onSelect(node.path)}
              className="rounded flex-shrink-0"
            />
            {isDir && (
              <button
                onClick={() => onToggle(node.path)}
                className="text-text-muted hover:text-text w-4 text-center text-xs"
              >
                {isExpanded ? "\u25BE" : "\u25B8"}
              </button>
            )}
            {!isDir && <span className="w-4" />}
            <span className={`text-xs truncate ${isDir ? "font-medium" : "font-mono"}`}>
              {node.name}
            </span>
          </div>
        </td>
        <td className="py-1.5 text-text-muted text-xs">{node.nodeType}</td>
        <td className="py-1.5 text-right text-text-muted text-xs pr-3">
          {node.size != null ? formatBytes(node.size) : "-"}
        </td>
        <td className="py-1.5 text-text-muted text-xs">
          {node.mtime ? new Date(node.mtime).toLocaleDateString() : "-"}
        </td>
      </tr>
      {isDir &&
        isExpanded &&
        node.children.map((child) => (
          <FileTreeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function SnapshotBrowser() {
  const { profileId } = useParams<{ profileId: string }>();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRestore, setShowRestore] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    listSnapshots(profileId)
      .then((snaps) => setSnapshots(snaps.sort((a, b) => b.time.localeCompare(a.time))))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [profileId]);

  async function handleSelectSnapshot(snap: Snapshot) {
    if (!profileId || !snap.id) return;
    setSelectedSnapshot(snap);
    setLoading(true);
    setError(null);
    setSelectedPaths(new Set());
    try {
      const files = await browseSnapshot(profileId, snap.id);
      setTree(buildTree(files));
      // Auto-expand first level
      const firstLevel = new Set(files.filter((n) => n.node_type === "dir").map((n) => n.path || n.name));
      setExpanded(firstLevel);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleForget(snapshotId: string) {
    if (!profileId) return;
    if (!confirm("Remove this snapshot? Data may be pruned later.")) return;
    try {
      await forgetSnapshots(profileId, [snapshotId]);
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
      if (selectedSnapshot?.id === snapshotId) {
        setSelectedSnapshot(null);
        setTree([]);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  function toggleExpanded(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleSelected(path: string) {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString();
  }

  return (
    <div className="flex h-full">
      {/* Snapshot list */}
      <div className="w-80 border-r border-border overflow-auto flex-shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Snapshots</h2>
          <p className="text-xs text-text-muted mt-1">
            {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
          </p>
        </div>
        {loading && snapshots.length === 0 && (
          <p className="p-4 text-sm text-text-muted">Loading...</p>
        )}
        {snapshots.map((snap) => (
          <button
            key={snap.id}
            onClick={() => handleSelectSnapshot(snap)}
            className={`w-full text-left p-4 border-b border-border hover:bg-bg-tertiary transition-colors ${
              selectedSnapshot?.id === snap.id ? "bg-bg-tertiary" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-accent">
                {snap.short_id || snap.id?.slice(0, 8)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (snap.id) handleForget(snap.id);
                }}
                className="text-xs text-text-muted hover:text-error"
              >
                forget
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-1">{formatTime(snap.time)}</p>
            <p className="text-xs text-text-muted mt-0.5 truncate">{snap.paths.join(", ")}</p>
            {snap.hostname && <p className="text-xs text-text-muted">{snap.hostname}</p>}
            {snap.summary && (
              <p className="text-xs text-text-muted mt-0.5">
                {snap.summary.total_files_processed.toLocaleString()} files &middot;{" "}
                {formatBytes(snap.summary.total_bytes_processed)}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* File browser */}
      <div className="flex-1 overflow-auto flex flex-col">
        {error && (
          <div className="m-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {selectedSnapshot ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Snapshot {selectedSnapshot.short_id || selectedSnapshot.id?.slice(0, 8)}
                </h3>
                <p className="text-xs text-text-muted">
                  {formatTime(selectedSnapshot.time)} &middot; {selectedSnapshot.hostname}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedPaths.size > 0 && (
                  <span className="text-xs text-text-muted">
                    {selectedPaths.size} selected
                  </span>
                )}
                <button
                  onClick={() => setShowRestore(true)}
                  className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
                >
                  {selectedPaths.size > 0 ? "Restore Selected" : "Restore All"}
                </button>
              </div>
            </div>

            {loading ? (
              <p className="p-4 text-sm text-text-muted">Loading files...</p>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-bg">
                    <tr className="border-b border-border text-text-muted text-xs">
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium w-16">Type</th>
                      <th className="text-right p-2 font-medium w-24">Size</th>
                      <th className="text-left p-2 font-medium w-28">Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.map((node) => (
                      <FileTreeRow
                        key={node.path}
                        node={node}
                        depth={0}
                        expanded={expanded}
                        onToggle={toggleExpanded}
                        selected={selectedPaths}
                        onSelect={toggleSelected}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            Select a snapshot to browse its contents
          </div>
        )}
      </div>

      {/* Restore dialog */}
      {showRestore && selectedSnapshot && profileId && (
        <RestoreDialog
          profileId={profileId}
          snapshot={selectedSnapshot}
          selectedPaths={Array.from(selectedPaths)}
          onClose={() => setShowRestore(false)}
        />
      )}
    </div>
  );
}
