import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/Shell";
import { ActiveRunView } from "../components/ActiveRunView";
import { ErrorBanner } from "../components/ErrorBanner";
import { useAppStore } from "../store";
import { togglePause, runBackup } from "../lib/tauri";
import {
  IconPlus,
  IconPlay,
  IconPause,
  IconCamera,
  IconDots,
  IconShield,
  IconClock,
  IconHdd,
  IconServer,
  IconBell,
  IconRefresh,
  IconFilter,
} from "../components/Icons";

const ProfileCard = ({ p, onUpdate }: { p: any, onUpdate: () => void }) => {
  const BackendIcon = p.is_remote ? IconServer : IconHdd;
  const dim = p.paused;
  const status = p.paused ? "paused" : p.last_run_exit_code === 0 ? "healthy" : p.last_run_exit_code === null ? "idle" : "warn";
  const navigate = useNavigate();
  const { startRun, runState } = useAppStore();

  const handleTogglePause = async () => {
    try {
      await togglePause(p.id);
      onUpdate();
    } catch(e) {
      console.error(e);
    }
  };

  const handleRunBackup = async () => {
    try {
      const runId = await runBackup(p.id);
      startRun(runId, p.id);
      onUpdate();
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div
      className="card"
      style={{ opacity: dim ? 0.7 : 1, position: "relative" }}
    >
      <div style={{ padding: "16px 18px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <span
            className={"status-dot " + status}
            style={{ marginTop: 7 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--text)",
                }}
              >
                {p.name}
              </div>
              {p.is_remote && <span className="badge">remote</span>}
              {p.paused && (
                <span className="badge paused">paused</span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
                color: "var(--text-3)",
                fontSize: 11.5,
              }}
            >
              <BackendIcon size={12} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-3)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {p.repo_url}
              </span>
            </div>
          </div>
          <button className="btn btn-icon" style={{ width: 24, height: 24 }} onClick={() => navigate(`/profiles/${p.id}`)}>
            <IconDots size={14} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <Meta
            label="Sources"
            value={`${p.source_count} paths`}
          />
          <Meta label="Schedule" value={p.has_schedule ? "Active" : "None"} />
          <Meta label="Last run" value={p.last_run_at ? new Date(p.last_run_at).toLocaleString() : "Never"} />
          <Meta
            label="Health"
            value={status}
            tone={status}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button className="btn btn-sm" onClick={handleTogglePause}>
            {p.paused ? (
              <IconPlay size={11} />
            ) : (
              <IconPause size={11} />
            )}
            {p.paused ? "Resume" : "Pause"}
          </button>
          <button className="btn btn-sm" onClick={() => navigate(`/snapshots/${p.id}`)}>
            <IconCamera size={11} /> Snapshots
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-sm btn-primary"
            onClick={handleRunBackup}
            disabled={runState === 'running'}
            style={{ opacity: runState === 'running' ? 0.5 : 1, cursor: runState === 'running' ? 'not-allowed' : 'pointer' }}
          >
            <IconPlay size={11} /> Run now
          </button>
        </div>
      </div>
    </div>
  );
};

const Meta = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) => (
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
        marginTop: 3,
        fontSize: 12.5,
        color:
          tone === "warn"
            ? "var(--warn)"
            : tone === "healthy"
            ? "var(--accent)"
            : "var(--text-2)",
        fontWeight: 500,
      }}
    >
      {value}
    </div>
  </div>
);

const HealthSummary = ({ profiles }: { profiles: any[] }) => {
  const healthy = profiles.filter(p => p.last_run_exit_code === 0 && !p.paused).length;
  const paused = profiles.filter(p => p.paused).length;
  const never = profiles.filter(p => p.last_run_at === null && !p.paused).length;
  
  const items = [
    { label: "Healthy", count: healthy, tone: "healthy", icon: IconShield },
    { label: "Paused", count: paused, tone: "paused", icon: IconPause },
    { label: "Never run", count: never, tone: "idle", icon: IconClock },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 10,
      }}
    >
      {items.map((it) => (
        <div key={it.label} className="card" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                background: "var(--surface-2)",
                color:
                  it.tone === "healthy"
                    ? "var(--accent)"
                    : it.tone === "warn"
                    ? "var(--warn)"
                    : "var(--text-3)",
              }}
            >
              <it.icon size={15} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {it.count}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-3)",
                  marginTop: 4,
                }}
              >
                {it.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { profiles, fetchProfiles } = useAppStore();
  const navigate = useNavigate();

  return (
    <>
      <TopBar
        title="Dashboard"
        sub={`${profiles.length} profiles loaded`}
        actions={
          <>
            <button className="btn btn-icon">
              <IconBell size={14} />
            </button>
            <button className="btn btn-icon" onClick={fetchProfiles}>
              <IconRefresh size={14} />
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/wizard')}>
              <IconPlus size={12} /> New profile
            </button>
          </>
        }
      />
      <div className="v-body">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 1180,
          }}
        >
          <ErrorBanner />
          <ActiveRunView />
          
          <HealthSummary profiles={profiles} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-2)",
              }}
            >
              All profiles
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-sm btn-ghost">
                <IconFilter size={11} /> Filter
              </button>
            </div>
          </div>

          {profiles.length === 0 ? (
             <div style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>
               No profiles yet. Create one to get started.
             </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {profiles.map((p) => (
                <ProfileCard key={p.id} p={p} onUpdate={fetchProfiles} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
