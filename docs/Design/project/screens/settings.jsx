/* Settings screen */
const {
  IconSettings, IconSun, IconMoon, IconTerminal, IconDownload, IconUpload,
  IconCheck, IconKey, IconBell, IconRefresh, IconShield, IconInfo,
  IconChevronRight, IconLock, IconDatabase,
} = window.Icons;
const { Sidebar, TopBar } = window.Shell;

const SettingsRow = ({ icon: Icon, title, sub, control, danger }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 14,
    padding: "16px 18px",
    borderBottom: "1px solid var(--border)",
  }}>
    {Icon && (
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: "var(--surface-2)", border: "1px solid var(--border)",
        display: "grid", placeItems: "center",
        color: danger ? "var(--danger)" : "var(--text-2)",
        flexShrink: 0,
      }}>
        <Icon size={14} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: danger ? "var(--danger)" : "var(--text)" }}>{title}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3, lineHeight: 1.5 }}>{sub}</div>}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{control}</div>
  </div>
);

const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>{title}</h3>
      {sub && <p style={{ fontSize: 12, color: "var(--text-3)", margin: "4px 0 0", lineHeight: 1.55 }}>{sub}</p>}
    </div>
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ "--last-no-border": 1 }}>
        {React.Children.map(children, (c, i) => (
          <div key={i} style={i === React.Children.count(children) - 1
            ? { } : {}}>
            {c}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ThemeChoice = ({ icon: Icon, label, active }) => (
  <div style={{
    padding: "8px 12px",
    border: "1px solid " + (active ? "var(--accent-line)" : "var(--border)"),
    background: active ? "var(--accent-soft)" : "var(--surface)",
    borderRadius: "var(--r-sm)",
    display: "flex", alignItems: "center", gap: 6,
    cursor: "pointer",
    color: active ? "var(--accent)" : "var(--text-2)",
    fontSize: 12, fontWeight: 500,
  }}>
    <Icon size={12} /> {label}
  </div>
);

const Settings = () => {
  const [theme] = React.useState("dark");
  const [keyring] = React.useState(true);
  const [notifySuccess] = React.useState(false);
  const [notifyFail] = React.useState(true);
  const [autoStart] = React.useState(true);

  return (
    <div className="v-app">
      <Sidebar
        active="Settings"
        profiles={[
          { name: "Home Documents", status: "running" },
          { name: "Photos Library", status: "healthy" },
          { name: "Production DB Server", status: "healthy" },
          { name: "Workstation Projects", status: "warn" },
        ]}
      />
      <div className="v-main">
        <TopBar
          title="Settings"
          sub="Customize Vaultik. Changes apply immediately."
          actions={null}
        />
        <div className="v-body">
          <div style={{ maxWidth: 720 }}>

            <Section
              title="Appearance"
              sub="How Vaultik looks. Theme follows your OS preference unless overridden."
            >
              <SettingsRow
                title="Theme"
                sub="Currently following system preference."
                control={
                  <div style={{ display: "flex", gap: 4 }}>
                    <ThemeChoice icon={IconSun} label="Light" />
                    <ThemeChoice icon={IconMoon} label="Dark" active={theme === "dark"} />
                    <ThemeChoice icon={IconRefresh} label="Auto" />
                  </div>
                }
              />
              <SettingsRow
                title="Reduce motion"
                sub="Disable progress bar shimmer and other ambient animations."
                control={<div className="toggle" />}
              />
              <SettingsRow
                title="Compact density"
                sub="Smaller spacing throughout. Useful for smaller displays."
                control={<div className="toggle" />}
              />
            </Section>

            <Section
              title="Restic binary"
              sub="Vaultik wraps restic. Bring your own — any installed version works."
            >
              <SettingsRow
                icon={IconTerminal}
                title="Detected restic"
                sub={
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>/usr/local/bin/restic</span>
                    <span className="badge healthy">v0.17.3</span>
                  </span>
                }
                control={<button className="btn btn-sm">Change…</button>}
              />
              <SettingsRow
                icon={IconRefresh}
                title="Check for restic updates"
                sub="Notify when a newer restic release is available."
                control={<div className="toggle on" />}
              />
            </Section>

            <Section
              title="Security & passwords"
              sub="How Vaultik handles your encryption keys."
            >
              <SettingsRow
                icon={IconKey}
                title="Default password storage"
                sub="Where new profiles store their encryption key by default."
                control={
                  <button className="btn btn-sm">
                    OS Keyring <IconChevronRight size={11} />
                  </button>
                }
              />
              <SettingsRow
                icon={IconShield}
                title="Lock Vaultik on idle"
                sub="Require re-authentication after 15 minutes of inactivity."
                control={<div className="toggle" />}
              />
              <SettingsRow
                icon={IconLock}
                title="Confirm destructive operations"
                sub="Always ask before forget, prune, or repository init."
                control={<div className="toggle on" />}
              />
            </Section>

            <Section
              title="Notifications"
              sub="Desktop notifications use your OS-native notification center."
            >
              <SettingsRow
                icon={IconBell}
                title="Backup succeeded"
                sub="Shows profile, new file count, and data added."
                control={<div className={"toggle" + (notifySuccess ? " on" : "")} />}
              />
              <SettingsRow
                icon={IconBell}
                title="Backup failed"
                sub="Shows profile and error message. Strongly recommended."
                control={<div className={"toggle" + (notifyFail ? " on" : "")} />}
              />
              <SettingsRow
                icon={IconBell}
                title="Partial completion"
                sub="Some files skipped, but the snapshot was saved."
                control={<div className="toggle on" />}
              />
            </Section>

            <Section
              title="Data management"
              sub="Profiles live as JSON in ~/.config/vaultik. Passwords stay in your OS keyring."
            >
              <SettingsRow
                icon={IconUpload}
                title="Export profiles"
                sub="Save all profile configurations to a JSON file. Passwords are not included."
                control={<button className="btn btn-sm">Export…</button>}
              />
              <SettingsRow
                icon={IconDownload}
                title="Import profiles"
                sub="Load profiles from a previously exported file. Duplicates are skipped."
                control={<button className="btn btn-sm">Import…</button>}
              />
              <SettingsRow
                icon={IconDatabase}
                title="Run history database"
                sub="142 runs · 4.2 MB · ~/.local/share/vaultik/history.db"
                control={<button className="btn btn-sm">Open folder</button>}
              />
            </Section>

            <Section title="About">
              <SettingsRow
                title="Vaultik"
                sub={
                  <span>
                    Version 0.1.0 · Tauri 2.0 · React 19 · ©&nbsp;2026 Kinan · AGPL-3.0
                  </span>
                }
                control={<button className="btn btn-sm btn-ghost">Check for updates</button>}
              />
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
};

window.Screens = window.Screens || {};
window.Screens.Settings = Settings;
