import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { listProfiles } from "@/lib/tauri";
import { open } from "@tauri-apps/plugin-shell";
import { useTheme } from "@/hooks/useTheme";
import { APP, LINKS } from "@/lib/config";
import type { ProfileSummary } from "@/lib/types";

function NavItem({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-accent/15 text-accent-hover"
            : "text-text-secondary hover:text-text hover:bg-bg-tertiary"
        }`
      }
    >
      <span className="text-base">{icon}</span>
      {label}
    </NavLink>
  );
}

function ExternalNavItem({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <button
      onClick={() => open(href)}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-text-secondary hover:text-text hover:bg-bg-tertiary w-full text-left"
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

function profileDotColor(p: ProfileSummary): string {
  if (p.paused) return "bg-text-muted opacity-50";
  if (p.last_run_exit_code === null && p.last_run_at === null) return "bg-text-muted";
  if (p.last_run_exit_code === 0) return "bg-success";
  if (p.last_run_exit_code === 3) return "bg-warning";
  return "bg-error";
}

export default function Sidebar() {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch(() => {});
  }, []);

  return (
    <aside className="w-56 h-full bg-bg-secondary border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">{APP.name}</h1>
        <button
          onClick={toggle}
          className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-bg-tertiary transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        <NavItem to="/" icon="&#9633;" label="Dashboard" />
        <NavItem to="/history" icon="&#8634;" label="Run History" />

        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Profiles
            </span>
            <button
              onClick={() => navigate("/profiles/new")}
              className="text-text-muted hover:text-accent text-lg leading-none"
              title="New Profile"
            >
              +
            </button>
          </div>
        </div>

        {profiles.map((p) => (
          <NavLink
            key={p.id}
            to={`/profiles/${p.id}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent-hover"
                  : "text-text-secondary hover:text-text hover:bg-bg-tertiary"
              }`
            }
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${profileDotColor(p)}`} />
            <span className={`truncate ${p.paused ? "opacity-60" : ""}`}>{p.name}</span>
            {p.paused && <span className="text-[10px] text-text-muted ml-auto">paused</span>}
          </NavLink>
        ))}

        {profiles.length === 0 && (
          <p className="px-3 py-2 text-xs text-text-muted">No profiles yet</p>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-1">
        <ExternalNavItem icon="?" label="Help & Docs" href={LINKS.resticDocs} />
        <NavItem to="/settings" icon="&#9881;" label="Settings" />
      </div>
    </aside>
  );
}
