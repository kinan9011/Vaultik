/* Profile Editor — left section nav, right form */
const {
  IconFolder, IconKey, IconClock, IconShield, IconHdd, IconCloud,
  IconServer, IconAlert, IconCheck, IconPlus, IconTrash, IconArrowLeft,
  IconChevronRight, IconChevronDown, IconEye, IconInfo, IconDatabase,
  IconLock, IconLink, IconRefresh,
} = window.Icons;
const { Sidebar, TopBar } = window.Shell;

const SECTIONS = [
  { key: "general", label: "General", icon: IconInfo },
  { key: "exec", label: "Execution mode", icon: IconServer },
  { key: "repo", label: "Repository", icon: IconDatabase, active: true },
  { key: "sources", label: "Backup sources", icon: IconFolder },
  { key: "exclude", label: "Exclusions", icon: IconLock },
  { key: "retention", label: "Retention", icon: IconClock },
  { key: "schedule", label: "Schedule", icon: IconClock },
  { key: "health", label: "Health checks", icon: IconShield },
  { key: "advanced", label: "Advanced", icon: IconRefresh },
];

const Field = ({ label, hint, children }) => (
  <div className="field" style={{ marginBottom: 18 }}>
    <label className="label">{label}</label>
    {children}
    {hint && <div className="hint">{hint}</div>}
  </div>
);

const ProfileEditor = () => (
  <div className="v-app">
    <Sidebar
      active="Editor:Production DB Server"
      profiles={[
        { name: "Home Documents", status: "running" },
        { name: "Photos Library", status: "healthy" },
        { name: "Production DB Server", status: "healthy" },
        { name: "Workstation Projects", status: "warn" },
      ]}
    />
    <div className="v-main">
      <TopBar
        breadcrumb={["Dashboard", "Production DB Server"]}
        title="Production DB Server"
        sub="Remote · SFTP · 2 sources · daily schedule"
        actions={
          <>
            <button className="btn btn-danger"><IconTrash size={12} /> Delete profile</button>
            <button className="btn">Discard</button>
            <button className="btn btn-primary"><IconCheck size={12} /> Save changes</button>
          </>
        }
      />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr", overflow: "hidden" }}>
        {/* Section nav */}
        <div style={{
          borderRight: "1px solid var(--border)",
          padding: "16px 10px", display: "flex", flexDirection: "column", gap: 2,
        }}>
          {SECTIONS.map((s) => (
            <div key={s.key} className={"v-nav-item" + (s.active ? " active" : "")}>
              <s.icon size={14} className="v-nav-icon" />
              {s.label}
              {s.key === "schedule" && <span className="v-nav-badge">on</span>}
              {s.key === "health" && <span className="v-nav-badge">5%</span>}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="v-body" style={{ padding: "24px 32px" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                Repository
              </h3>
              <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: 0, lineHeight: 1.55 }}>
                Where snapshots are stored. The repository URL points to a restic-compatible backend, and the password encrypts every byte before it leaves your machine.
              </p>
            </div>

            <Field label="Backend">
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
              }}>
                {[
                  { icon: IconHdd, label: "Local" },
                  { icon: IconServer, label: "SFTP", active: true },
                  { icon: IconCloud, label: "S3" },
                  { icon: IconCloud, label: "B2" },
                  { icon: IconCloud, label: "Azure" },
                  { icon: IconCloud, label: "GCS" },
                  { icon: IconServer, label: "REST" },
                  { icon: IconCloud, label: "rclone" },
                ].map((b) => (
                  <div key={b.label} style={{
                    padding: "10px 0",
                    border: "1px solid " + (b.active ? "var(--accent-line)" : "var(--border)"),
                    background: b.active ? "var(--accent-soft)" : "var(--surface)",
                    borderRadius: "var(--r-sm)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    cursor: "pointer",
                    color: b.active ? "var(--accent)" : "var(--text-2)",
                  }}>
                    <b.icon size={14} />
                    <span style={{ fontSize: 11.5, fontWeight: 500 }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </Field>

            <Field label="Repository URL" hint="Includes user, host, and path. Vaultik will not modify this format.">
              <div className="row">
                <input className="input mono" defaultValue="sftp:ops@db-01.local:/srv/backup/restic" />
                <button className="btn"><IconLink size={11} /> Test</button>
              </div>
            </Field>

            <Field label="Password storage">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {[
                  { label: "OS Keyring", sub: "Recommended", active: true },
                  { label: "Password file", sub: "Path to file" },
                  { label: "Command", sub: "Shell command" },
                ].map((m) => (
                  <div key={m.label} style={{
                    padding: 10,
                    border: "1px solid " + (m.active ? "var(--accent-line)" : "var(--border)"),
                    background: m.active ? "var(--accent-soft)" : "var(--surface)",
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        width: 12, height: 12, borderRadius: "50%",
                        border: "1.5px solid " + (m.active ? "var(--accent)" : "var(--border-strong)"),
                        background: m.active ? "var(--accent)" : "transparent",
                        display: "grid", placeItems: "center",
                      }}>
                        {m.active && <span style={{ width: 4, height: 4, background: "#04221a", borderRadius: "50%" }} />}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: m.active ? "var(--accent)" : "var(--text)" }}>
                        {m.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4, marginLeft: 18 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </Field>

            <Field label="Encryption password"
              hint="Stored in your OS keyring under the service ‘vaultik’. Never sent or logged.">
              <div className="row">
                <div style={{ flex: 1, position: "relative" }}>
                  <input className="input mono" type="password" defaultValue="••••••••••••••••••••" style={{ paddingRight: 32 }} />
                  <IconEye size={13} style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    color: "var(--text-3)", cursor: "pointer",
                  }} />
                </div>
                <button className="btn">Change</button>
              </div>
            </Field>

            {/* Repo status panel */}
            <div className="card" style={{ marginTop: 8, padding: "14px 16px",
              background: "var(--accent-soft)", borderColor: "var(--accent-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(52,211,153,0.18)",
                  display: "grid", placeItems: "center", color: "var(--accent)",
                }}>
                  <IconCheck size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                    Repository reachable and unlocked
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    46 snapshots · 12.4 GB on disk · last verified 2 hours ago
                  </div>
                </div>
                <button className="btn btn-sm">Init new repo</button>
              </div>
            </div>

            {/* Danger zone */}
            <div style={{
              marginTop: 28, padding: "16px 18px",
              borderRadius: "var(--r-lg)",
              border: "1px solid rgba(248,113,113,0.22)",
              background: "rgba(248,113,113,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <IconAlert size={14} style={{ color: "var(--danger)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Danger zone</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>Unlock repository</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2 }}>
                    Remove a stale lock left by a crashed restic process. Use only if you’re certain nothing is running.
                  </div>
                </div>
                <button className="btn">Unlock</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

window.Screens = window.Screens || {};
window.Screens.ProfileEditor = ProfileEditor;
