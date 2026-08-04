/* Vaultik app shell — sidebar + topbar wrapper */
const { IconHome, IconHistory, IconSettings, IconCamera, IconFolder,
        IconPlus, IconBell, IconShield, VaultikLogo } = window.Icons;

const Sidebar = ({ active = "Dashboard", profiles = [] }) => (
  <aside className="v-side">
    <div className="v-brand">
      <div className="v-brand-mark"><VaultikLogo size={18} /></div>
      <div className="v-brand-name">Vaultik</div>
      <div className="v-brand-tag">v0.1.0</div>
    </div>

    <nav className="v-nav">
      <div className={"v-nav-item" + (active === "Dashboard" ? " active" : "")}>
        <IconHome size={15} className="v-nav-icon" />
        Dashboard
      </div>
      <div className={"v-nav-item" + (active === "History" ? " active" : "")}>
        <IconHistory size={15} className="v-nav-icon" />
        Run History
        <span className="v-nav-badge">142</span>
      </div>
      <div className={"v-nav-item" + (active === "Settings" ? " active" : "")}>
        <IconSettings size={15} className="v-nav-icon" />
        Settings
      </div>
    </nav>

    {profiles.length > 0 && (
      <>
        <div className="v-section-label">Profiles</div>
        <nav className="v-nav">
          {profiles.map((p) => (
            <div
              key={p.name}
              className={
                "v-nav-item" +
                (active === "Snapshots:" + p.name || active === "Editor:" + p.name
                  ? " active"
                  : "")
              }
            >
              <span className={"status-dot " + p.status} style={{ width: 7, height: 7 }} />
              <span style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{p.name}</span>
            </div>
          ))}
        </nav>
      </>
    )}

    <div className="v-side-foot">
      <div className="v-restic-pill">
        <div className="dot" />
        <span>restic ready</span>
        <span className="ver">0.17.3</span>
      </div>
    </div>
  </aside>
);

const TopBar = ({ title, sub, actions, breadcrumb }) => (
  <div className="v-top">
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      {breadcrumb && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-4)", fontSize: 11.5 }}>
          {breadcrumb.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: "var(--text-4)" }}>/</span>}
              <span style={{ color: i === breadcrumb.length - 1 ? "var(--text-2)" : "var(--text-4)" }}>{b}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="v-top-title">{title}</div>
      {sub && <div className="v-top-sub">{sub}</div>}
    </div>
    <div className="v-top-actions">{actions}</div>
  </div>
);

window.Shell = { Sidebar, TopBar };
