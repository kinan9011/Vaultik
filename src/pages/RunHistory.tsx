import { useEffect, useState } from "react";
import { TopBar } from "../components/Shell";
import { useAppStore } from "../store";
import { getRunHistory } from "../lib/tauri";
import { RunRecord } from "../lib/types";
import {
  IconCheck,
  IconAlert,
  IconX,
  IconRefresh,
  IconChevronRight,
  IconChevronDown,
  IconSearch,
  IconPlay,
  IconRestore,
  IconShield,
  IconDownload,
  IconTrash,
} from "../components/Icons";

const STATUS_MAP: Record<string, any> = {
  running: { label: "running", color: "var(--info)", bg: "var(--info-soft)", border: "rgba(96,165,250,0.32)", icon: IconRefresh },
  success: { label: "success", color: "var(--accent)", bg: "var(--accent-soft)", border: "var(--accent-line)", icon: IconCheck },
  warn: { label: "partial", color: "var(--warn)", bg: "var(--warn-soft)", border: "rgba(251,191,36,0.32)", icon: IconAlert },
  fail: { label: "failed", color: "var(--danger)", bg: "var(--danger-soft)", border: "rgba(248,113,113,0.32)", icon: IconX },
};

const OP_ICON: Record<string, any> = {
  backup: IconPlay,
  restore: IconRestore,
  check: IconShield,
  forget: IconTrash,
};

const RunRow = ({ r, profileName }: { r: RunRecord, profileName: string }) => {
  const [expanded, setExpanded] = useState(false);
  const status = r.finished_at === null ? "running" : r.exit_code === 0 ? "success" : r.exit_code === 3 ? "warn" : "fail";
  const s = STATUS_MAP[status];
  const Op = OP_ICON[r.operation] || IconPlay;
  
  // Try to parse summary / errors
  let details: any = null;
  let errorList: string[] = [];
  try {
    if (r.summary) details = JSON.parse(r.summary);
  } catch (e) {}
  try {
    if (r.errors) errorList = JSON.parse(r.errors);
  } catch (e) {}

  const note = errorList.length > 0 ? errorList[0] : null;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            borderRadius: 100,
            background: s.bg,
            color: s.color,
            border: "1px solid " + s.border,
            fontSize: 11,
            fontWeight: 500,
            fontVariantCaps: "all-small-caps",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            minWidth: 78,
            justifyContent: "center",
          }}
        >
          <s.icon
            size={10}
            style={status === "running" ? { animation: "spin 1.6s linear infinite" } : undefined}
          />
          {s.label}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <Op size={13} style={{ color: "var(--text-3)" }} />
          <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>
            {r.operation[0].toUpperCase() + r.operation.slice(1)}
          </span>
          <span style={{ color: "var(--text-4)" }}>·</span>
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>{profileName}</span>
          <span className="badge" style={{ fontSize: 10.5 }}>
            {r.trigger}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              color: "var(--text-2)",
            }}
          >
            {/* calculate duration */
              r.finished_at ? `${Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000)}s` : "Running..."
            }
          </span>
          <span style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>
            {new Date(r.started_at).toLocaleString()}
          </span>
        </div>

        <button className="btn btn-icon" style={{ width: 26, height: 26 }} onClick={() => setExpanded(!expanded)}>
          {expanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
        </button>
      </div>

      {expanded && details && (
        <div
          style={{
            padding: "12px 18px 16px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-2)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
          }}
        >
          <Detail label="Files processed" value={String(details.total_files_processed || 0)} />
          <Detail label="Data added" value={String(details.data_added || 0)} mono />
          <Detail label="Changed files" value={String(details.files_changed || 0)} />
          <Detail label="New files" value={String(details.files_new || 0)} />
          <div
            style={{
              gridColumn: "1 / -1",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {r.snapshot_id && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-3)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: "var(--surface-2)",
                }}
              >
                snapshot {r.snapshot_id.slice(0, 8)}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <button className="btn btn-sm btn-ghost">
              <IconDownload size={11} /> Export log
            </button>
          </div>
        </div>
      )}

      {!expanded && note && (
        <div
          style={{
            padding: "10px 18px",
            borderTop: "1px solid var(--border)",
            fontSize: 11.5,
            color:
              status === "fail"
                ? "var(--danger)"
                : status === "warn"
                ? "var(--warn)"
                : "var(--text-3)",
            fontFamily: "var(--font-mono)",
            background:
              status === "fail"
                ? "rgba(248,113,113,0.04)"
                : status === "warn"
                ? "rgba(251,191,36,0.04)"
                : "var(--bg-2)",
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <div
      style={{
        fontSize: 10.5,
        color: "var(--text-4)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        fontWeight: 500,
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 4,
        fontSize: 14,
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontWeight: mono ? 500 : 600,
        color: "var(--text)",
      }}
    >
      {value}
    </div>
  </div>
);

export default function RunHistory() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const { profiles, fetchProfiles } = useAppStore();

  useEffect(() => {
    fetchProfiles();
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const data = await getRunHistory(undefined, 100);
      setRuns(data);
    } catch(e) {
      console.error(e);
    }
  };

  const successfulRuns = runs.filter(r => r.exit_code === 0).length;
  const partialRuns = runs.filter(r => r.exit_code === 3).length;
  const failedRuns = runs.filter(r => r.exit_code !== 0 && r.exit_code !== 3 && r.finished_at !== null).length;

  return (
    <>
      <TopBar
        title="Run History"
        sub="Every backup, restore, check, and forget operation — fully searchable."
        actions={
          <>
            <button className="btn">
              <IconDownload size={12} /> Export
            </button>
            <button className="btn" onClick={loadRuns}>
              <IconRefresh size={12} /> Refresh
            </button>
          </>
        }
      />
      <div className="v-body">
        <div style={{ maxWidth: 1100 }}>
          <div
            className="card"
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
              <IconSearch
                size={12}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-4)",
                }}
              />
              <input
                className="input"
                placeholder="Search by profile, operation, error message…"
                style={{ paddingLeft: 28 }}
              />
            </div>

            <FilterPill label="Profile" value="All profiles" />
            <FilterPill label="Operation" value="All" />
            <FilterPill label="Status" value="All" />
            <FilterPill label="Range" value="Last 30 days" />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <StatTile label="Total runs" value={runs.length.toString()} tone="text" />
            <StatTile label="Successful" value={successfulRuns.toString()} tone="ok" sub={`${runs.length ? ((successfulRuns / runs.length) * 100).toFixed(1) : 0}%`} />
            <StatTile label="Partial / warnings" value={partialRuns.toString()} tone="warn" />
            <StatTile label="Failed" value={failedRuns.toString()} tone="bad" />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {runs.length === 0 ? <div style={{padding: 20, color: "var(--text-3)"}}>No runs found in history.</div> : null}
            {runs.map((r) => {
               const profileName = profiles.find(p => p.id === r.profile_id)?.name || r.profile_id;
               return <RunRow key={r.id} r={r} profileName={profileName} />;
            })}
          </div>

        </div>
      </div>
    </>
  );
}

const FilterPill = ({ label, value }: { label: string; value: string }) => (
  <button className="btn btn-sm" style={{ padding: "5px 10px" }}>
    <span style={{ color: "var(--text-4)", fontSize: 11 }}>{label}:</span>
    <span style={{ color: "var(--text)", marginLeft: 4 }}>{value}</span>
    <IconChevronDown size={11} style={{ color: "var(--text-4)" }} />
  </button>
);

const StatTile = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: string;
}) => {
  const color =
    tone === "ok"
      ? "var(--accent)"
      : tone === "warn"
      ? "var(--warn)"
      : tone === "bad"
      ? "var(--danger)"
      : "var(--text)";
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-4)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginTop: 4,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 22,
            fontWeight: 500,
            color: color,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </span>
        {sub && (
          <span style={{ fontSize: 11, color: "var(--text-4)" }}>{sub}</span>
        )}
      </div>
    </div>
  );
};
