import { TopBar } from "../components/Shell";
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

const RUNS = [
  {
    status: "running",
    profile: "Home Documents",
    op: "backup",
    trigger: "manual",
    started: "Today, 14:26",
    duration: "Running…",
    expanded: true,
    details: { files: "14,523 / 21,890", added: "318 MB", changed: "642", new: "84" },
  },
  {
    status: "success",
    profile: "Photos Library",
    op: "backup",
    trigger: "scheduled",
    started: "Today, 12:00",
    duration: "8m 14s",
    details: { files: "412,008", added: "12 MB", changed: "4", new: "12" },
  },
  {
    status: "success",
    profile: "Production DB Server",
    op: "check",
    trigger: "scheduled",
    started: "Today, 11:30",
    duration: "2m 41s",
  },
  {
    status: "warn",
    profile: "Workstation Projects",
    op: "backup",
    trigger: "scheduled",
    started: "Today, 09:04",
    duration: "12m 06s",
    note: "3 files skipped (permission denied)",
  },
  {
    status: "success",
    profile: "Production DB Server",
    op: "backup",
    trigger: "scheduled",
    started: "Today, 09:00",
    duration: "1m 38s",
  },
  {
    status: "success",
    profile: "Home Documents",
    op: "restore",
    trigger: "manual",
    started: "Yesterday, 17:42",
    duration: "3m 22s",
    note: "Restored 142 files to /tmp/restore-may-18",
  },
  {
    status: "fail",
    profile: "Workstation Projects",
    op: "backup",
    trigger: "scheduled",
    started: "Yesterday, 18:00",
    duration: "0m 04s",
    note: "Failed: repository is locked (held by PID 4128 on db-01)",
  },
  {
    status: "success",
    profile: "Production DB Server",
    op: "forget",
    trigger: "scheduled",
    started: "Yesterday, 03:00",
    duration: "0m 12s",
    note: "Removed 2 snapshots · pruned 384 MB",
  },
  {
    status: "success",
    profile: "Photos Library",
    op: "backup",
    trigger: "scheduled",
    started: "May 17, 03:00",
    duration: "11m 02s",
  },
];

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

const RunRow = ({ r }: { r: typeof RUNS[0] }) => {
  const s = STATUS_MAP[r.status];
  const Op = OP_ICON[r.op];
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
            style={r.status === "running" ? { animation: "spin 1.6s linear infinite" } : undefined}
          />
          {s.label}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <Op size={13} style={{ color: "var(--text-3)" }} />
          <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>
            {r.op[0].toUpperCase() + r.op.slice(1)}
          </span>
          <span style={{ color: "var(--text-4)" }}>·</span>
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>{r.profile}</span>
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
            {r.duration}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>
            {r.started}
          </span>
        </div>

        <button className="btn btn-icon" style={{ width: 26, height: 26 }}>
          {r.expanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
        </button>
      </div>

      {r.expanded && r.details && (
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
          <Detail label="Files processed" value={r.details.files} />
          <Detail label="Data added" value={r.details.added} mono />
          <Detail label="Changed files" value={r.details.changed} />
          <Detail label="New files" value={r.details.new} />
          <div
            style={{
              gridColumn: "1 / -1",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
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
              snapshot 8a2f7c1d
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn btn-sm btn-ghost">
              <IconDownload size={11} /> Export log
            </button>
          </div>
        </div>
      )}

      {!r.expanded && r.note && (
        <div
          style={{
            padding: "10px 18px",
            borderTop: "1px solid var(--border)",
            fontSize: 11.5,
            color:
              r.status === "fail"
                ? "var(--danger)"
                : r.status === "warn"
                ? "var(--warn)"
                : "var(--text-3)",
            fontFamily: "var(--font-mono)",
            background:
              r.status === "fail"
                ? "rgba(248,113,113,0.04)"
                : r.status === "warn"
                ? "rgba(251,191,36,0.04)"
                : "var(--bg-2)",
          }}
        >
          {r.note}
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
            <StatTile label="Total runs" value="142" tone="text" />
            <StatTile label="Successful" value="134" tone="ok" sub="94.4%" />
            <StatTile label="Partial / warnings" value="6" tone="warn" />
            <StatTile label="Failed" value="2" tone="bad" />
          </div>

          <DaySep label="Today, May 19" count={4} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {RUNS.slice(0, 4).map((r, i) => (
              <RunRow key={i} r={r} />
            ))}
          </div>

          <DaySep label="Yesterday, May 18" count={3} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {RUNS.slice(4, 7).map((r, i) => (
              <RunRow key={i} r={r} />
            ))}
          </div>

          <DaySep label="Saturday, May 17" count={2} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RUNS.slice(7).map((r, i) => (
              <RunRow key={i} r={r} />
            ))}
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

const DaySep = ({ label, count }: { label: string; count: number }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    }}
  >
    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
      {label}
    </span>
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--text-4)",
      }}
    >
      {count} runs
    </span>
    <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
  </div>
);
