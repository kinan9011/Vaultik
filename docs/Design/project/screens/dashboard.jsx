/* Dashboard screen — with active backup + profile cards */
const {
  IconPlus, IconPlay, IconPause, IconStop, IconCamera, IconDots,
  IconShield, IconClock, IconAlert, IconHdd, IconCloud, IconServer,
  IconBell, IconChevronRight, IconRefresh, IconLock,
} = window.Icons;
const { Sidebar, TopBar } = window.Shell;

const SAMPLE_PROFILES = [
  {
    name: "Home Documents",
    status: "running",
    backendIcon: IconHdd,
    backend: "Local",
    repo: "/mnt/backup/home-repo",
    sources: 3,
    schedule: "Daily · 02:00",
    lastRun: "Running now",
  },
  {
    name: "Photos Library",
    status: "healthy",
    backendIcon: IconCloud,
    backend: "Backblaze B2",
    repo: "b2:photos-cold:family",
    sources: 1,
    schedule: "Weekly · Sun 03:00",
    lastRun: "2 hours ago",
  },
  {
    name: "Production DB Server",
    status: "healthy",
    backendIcon: IconServer,
    backend: "SFTP · ssh",
    repo: "sftp:ops@db-01:/srv/restic",
    sources: 2,
    schedule: "Hourly",
    lastRun: "23 min ago",
    remote: true,
  },
  {
    name: "Workstation Projects",
    status: "warn",
    backendIcon: IconCloud,
    backend: "S3",
    repo: "s3:s3.amazonaws.com/work-snaps",
    sources: 4,
    schedule: "Daily · 18:00",
    lastRun: "Yesterday, 18:04",
    note: "3 files skipped (permission denied)",
  },
  {
    name: "Old Laptop Archive",
    status: "paused",
    backendIcon: IconHdd,
    backend: "Local",
    repo: "/mnt/archive/laptop",
    sources: 2,
    schedule: "Paused",
    lastRun: "5 days ago",
  },
  {
    name: "Music & Media",
    status: "idle",
    backendIcon: IconCloud,
    backend: "rclone",
    repo: "rclone:gdrive:media-backup",
    sources: 1,
    schedule: "Not scheduled",
    lastRun: "Never run",
  },
];

const ActiveBackupCard = () => (
  <div className="card" style={{
    background: "linear-gradient(180deg, rgba(96,165,250,0.08) 0%, var(--surface) 60%)",
    borderColor: "rgba(96,165,250,0.25)",
  }}>
    <div style={{ padding: "18px 22px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          display: "grid",
          placeItems: "center",
          width: 36, height: 36,
          borderRadius: 10,
          background: "rgba(96,165,250,0.14)",
          border: "1px solid rgba(96,165,250,0.28)",
        }}>
          <IconRefresh size={16} className="" style={{ color: "var(--info)", animation: "spin 2.4s linear infinite" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Home Documents</div>
            <span className="badge info">backing up</span>
          </div>
          <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>
            Started 4 min ago · estimated 2m 14s remaining
          </div>
        </div>
        <button className="btn btn-sm">
          <IconStop size={12} /> Cancel
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div className="bar" style={{ flex: 1, height: 8 }}>
          <div className="bar-fill" style={{ width: "67%" }} />
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)" }}>67%</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 14 }}>
        <Stat label="Files processed" value="14,523" total="/ 21,890" />
        <Stat label="Data transferred" value="3.2 GB" total="/ 4.8 GB" />
        <Stat label="Throughput" value="42.6 MB/s" />
        <Stat label="Errors" value="0" tone="ok" />
      </div>

      <div style={{
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px dashed var(--border)",
        display: "flex", alignItems: "center", gap: 10,
        fontFamily: "var(--font-mono)", fontSize: 11.5,
        color: "var(--text-3)",
      }}>
        <span style={{ color: "var(--text-4)" }}>scanning</span>
        <span style={{
          color: "var(--text-2)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}>
          /home/kinan/Documents/projects/vaultik/src-tauri/target/release/build/…/output.rs
        </span>
      </div>
    </div>
  </div>
);

const Stat = ({ label, value, total, tone }) => (
  <div>
    <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>
      {label}
    </div>
    <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: 18,
        fontWeight: 500,
        color: tone === "ok" ? "var(--accent)" : "var(--text)",
        letterSpacing: "-0.01em",
      }}>{value}</span>
      {total && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-4)" }}>{total}</span>}
    </div>
  </div>
);

const HealthSummary = () => {
  const items = [
    { label: "Healthy", count: 3, tone: "healthy", icon: IconShield },
    { label: "Warning", count: 1, tone: "warn", icon: IconAlert },
    { label: "Paused", count: 1, tone: "paused", icon: IconPause },
    { label: "Never run", count: 1, tone: "idle", icon: IconClock },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
      {items.map((it) => (
        <div key={it.label} className="card" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              display: "grid", placeItems: "center",
              background: "var(--surface-2)",
              color: it.tone === "healthy" ? "var(--accent)"
                : it.tone === "warn" ? "var(--warn)"
                : "var(--text-3)",
            }}>
              <it.icon size={15} />
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 20, fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}>{it.count}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>{it.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfileCard = ({ p }) => {
  const BackendIcon = p.backendIcon;
  const dim = p.status === "paused";
  return (
    <div className="card" style={{ opacity: dim ? 0.7 : 1, position: "relative" }}>
      <div style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <span className={"status-dot " + p.status} style={{ marginTop: 7 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{p.name}</div>
              {p.remote && <span className="badge">remote</span>}
              {p.status === "paused" && <span className="badge paused">paused</span>}
              {p.status === "running" && <span className="badge info">running</span>}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginTop: 4,
              color: "var(--text-3)", fontSize: 11.5,
            }}>
              <BackendIcon size={12} />
              <span>{p.backend}</span>
              <span style={{ color: "var(--text-4)" }}>·</span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--text-3)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                minWidth: 0,
              }}>{p.repo}</span>
            </div>
          </div>
          <button className="btn btn-icon" style={{ width: 24, height: 24 }}>
            <IconDots size={14} />
          </button>
        </div>

        {/* Meta grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <Meta label="Sources" value={`${p.sources} ${p.sources === 1 ? "path" : "paths"}`} />
          <Meta label="Schedule" value={p.schedule} />
          <Meta label="Last run" value={p.lastRun} />
          <Meta label="Health" value={
            p.status === "healthy" ? "All good" :
            p.status === "warn" ? "1 warning" :
            p.status === "running" ? "Backing up…" :
            p.status === "paused" ? "Paused" : "—"
          } tone={p.status} />
        </div>

        {p.note && (
          <div style={{
            display: "flex", gap: 6, alignItems: "flex-start",
            padding: "8px 10px",
            background: "var(--warn-soft)",
            border: "1px solid rgba(251,191,36,0.22)",
            borderRadius: "var(--r-sm)",
            color: "var(--warn)",
            fontSize: 11.5,
            marginBottom: 12,
          }}>
            <IconAlert size={12} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{p.note}</span>
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-sm">
            {p.status === "paused" ? <IconPlay size={11} /> : <IconPause size={11} />}
            {p.status === "paused" ? "Resume" : "Pause"}
          </button>
          <button className="btn btn-sm">
            <IconCamera size={11} /> Snapshots
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm btn-primary" disabled={p.status === "running"}>
            <IconPlay size={11} /> Run now
          </button>
        </div>
      </div>
    </div>
  );
};

const Meta = ({ label, value, tone }) => (
  <div>
    <div style={{
      fontSize: 10.5, color: "var(--text-4)",
      textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500,
    }}>{label}</div>
    <div style={{
      marginTop: 3, fontSize: 12.5,
      color: tone === "warn" ? "var(--warn)" : tone === "healthy" ? "var(--accent)" : "var(--text-2)",
      fontWeight: 500,
    }}>{value}</div>
  </div>
);

const Dashboard = () => (
  <div className="v-app">
    <Sidebar active="Dashboard" profiles={SAMPLE_PROFILES.slice(0, 4).map(p => ({ name: p.name, status: p.status }))} />
    <div className="v-main">
      <TopBar
        title="Dashboard"
        sub="6 profiles · 1 currently backing up"
        actions={
          <>
            <button className="btn btn-icon"><IconBell size={14} /></button>
            <button className="btn btn-icon"><IconRefresh size={14} /></button>
            <button className="btn btn-primary">
              <IconPlus size={12} /> New profile
            </button>
          </>
        }
      />
      <div className="v-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1180 }}>
          <ActiveBackupCard />
          <HealthSummary />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
              All profiles
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-sm btn-ghost"><IconFilter size={11} /> Filter</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {SAMPLE_PROFILES.map((p) => (
              <ProfileCard key={p.name} p={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const { IconFilter } = window.Icons;

window.Screens = window.Screens || {};
window.Screens.Dashboard = Dashboard;

/* spin keyframe */
const styleEl = document.createElement("style");
styleEl.textContent = "@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }";
document.head.appendChild(styleEl);
