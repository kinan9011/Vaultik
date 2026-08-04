# Vaultik Functional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the Vaultik React frontend to the existing Tauri/Rust backend logic, replacing all static placeholder data with real data using the `src/lib/tauri.ts` client API.

**Architecture:** 
1. Use `zustand` for global state management (profiles list, active tasks).
2. Wire up the Dashboard to list real profiles and start/pause backups.
3. Wire up the Wizard and ProfileEditor to allow creating and editing profiles.
4. Wire up the SnapshotBrowser to list and browse actual snapshots.
5. Wire up RunHistory and Settings to their respective backend commands.

**Tech Stack:** React, TypeScript, Zustand, Tauri v2.

---

### Task 1: Setup Zustand Store

**Files:**
- Create: `src/store/index.ts`

- [ ] **Step 1: Write store**

```typescript
import { create } from 'zustand';
import { ProfileSummary } from '../lib/types';
import { listProfiles } from '../lib/tauri';

interface AppState {
  profiles: ProfileSummary[];
  loading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  profiles: [],
  loading: false,
  error: null,
  fetchProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const data = await listProfiles();
      set({ profiles: data, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },
}));
```

- [ ] **Step 2: Run build to verify types**

Run: `npm run build`
Expected: Passes without errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/index.ts
git commit -m "feat: add zustand store for profiles"
```

---

### Task 2: Connect Shell & App to Store

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Shell.tsx`

- [ ] **Step 1: Update App.tsx**

```tsx
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Shell";
import Dashboard from "./pages/Dashboard";
import ProfileEditor from "./pages/ProfileEditor";
import SnapshotBrowser from "./pages/SnapshotBrowser";
import RunHistory from "./pages/RunHistory";
import Settings from "./pages/Settings";
import Wizard from "./pages/Wizard";
import { useAppStore } from "./store";

export default function App() {
  const { profiles, fetchProfiles } = useAppStore();

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const sidebarProfiles = profiles.map(p => ({
    name: p.name,
    status: p.paused ? "paused" : p.last_run_exit_code === 0 ? "healthy" : p.last_run_exit_code === null ? "idle" : "warn"
  }));

  return (
    <div className="v-app">
      <Sidebar profiles={sidebarProfiles} />
      <div className="v-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/profiles/new" element={<ProfileEditor />} />
          <Route path="/profiles/:id" element={<ProfileEditor />} />
          <Route path="/snapshots/:profileId" element={<SnapshotBrowser />} />
          <Route path="/history" element={<RunHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update Shell.tsx**
    Currently `Shell.tsx` accepts `profiles`. We need to export `Sidebar` correctly.
    Open `src/components/Shell.tsx` and just confirm it accepts `profiles?: { name: string, status: string }[]`. The types map correctly based on our changes in App.tsx. Ensure no type errors.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Passes without errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/Shell.tsx
git commit -m "feat: connect global state to shell navigation"
```

---

### Task 3: Hook up Dashboard Real Data

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Replace SAMPLE_PROFILES**
    In `src/pages/Dashboard.tsx`, replace the static `SAMPLE_PROFILES` with data derived from `useAppStore`. Implement a mock conversion since `ProfileSummary` doesn't have all details yet (e.g. backend type).

```tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/Shell";
import { useAppStore } from "../store";
import { togglePause, runBackup } from "../lib/tauri";
import {
  IconPlus,
  IconPlay,
  IconPause,
  IconStop,
  IconCamera,
  IconDots,
  IconShield,
  IconClock,
  IconAlert,
  IconHdd,
  IconCloud,
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
      await runBackup(p.id);
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
          <Meta label="Last run" value={p.last_run_at || "Never"} />
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

// We keep HealthSummary static for now or calculate from profiles.
const HealthSummary = ({ profiles }: { profiles: any[] }) => {
  const healthy = profiles.filter(p => p.last_run_exit_code === 0).length;
  const paused = profiles.filter(p => p.paused).length;
  const never = profiles.filter(p => p.last_run_at === null).length;
  
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
          {/* We'll skip ActiveBackupCard until we have event listeners setup */}
          
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
```

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: hook up dashboard to real profiles data"
```

---

### Task 4: Connect SnapshotBrowser

**Files:**
- Modify: `src/pages/SnapshotBrowser.tsx`

- [ ] **Step 1: Write logic**
    Fetch `listSnapshots` on mount for the given `profileId` parameter from React Router. Replace `SNAPSHOTS` dummy data. Remove static `TREE` and use `browseSnapshot` when a snapshot is selected. This is a larger change, but implementing just the snapshot list is enough for this task.

```tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { TopBar } from "../components/Shell";
import { listSnapshots, browseSnapshot } from "../lib/tauri";
import { Snapshot, LsNode } from "../lib/types";
import {
  IconFolder,
  IconFile,
  IconChevronRight,
  IconChevronDown,
  IconRestore,
  IconTrash,
  IconSearch,
  IconCheck,
  IconShield,
  IconRefresh,
} from "../components/Icons";

const SnapshotItem = ({ s, active, onClick }: { s: Snapshot, active: boolean, onClick: () => void }) => (
  <div
    onClick={onClick}
    style={{
      padding: "12px 14px",
      borderRadius: 8,
      cursor: "pointer",
      background: active ? "var(--surface-2)" : "transparent",
      border: "1px solid " + (active ? "var(--border-strong)" : "transparent"),
      position: "relative",
    }}
  >
    {active && (
      <span
        style={{
          position: "absolute",
          left: -1,
          top: 12,
          bottom: 12,
          width: 2,
          background: "var(--gold)",
          borderRadius: 100,
        }}
      />
    )}
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11.5,
          color: active ? "var(--gold)" : "var(--text-2)",
          fontWeight: 500,
        }}
      >
        {s.short_id || s.id?.slice(0, 8)}
      </span>
      <span className="badge" style={{ fontSize: 10, padding: "1px 6px" }}>
        {s.tags.length > 0 ? s.tags.join(",") : "auto"}
      </span>
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--text-4)",
        }}
      >
        {s.summary ? `${(s.summary.total_bytes_processed / 1024 / 1024).toFixed(1)} MB` : ""}
      </span>
    </div>
    <div style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 2 }}>
      {new Date(s.time).toLocaleString()}
    </div>
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        color: "var(--text-4)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {s.paths.join(", ")}
    </div>
  </div>
);

export default function SnapshotBrowser() {
  const { profileId } = useParams<{ profileId: string }>();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [activeSnapId, setActiveSnapId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<LsNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profileId) {
      loadSnapshots();
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId && activeSnapId) {
      loadNodes(activeSnapId);
    }
  }, [activeSnapId, profileId]);

  const loadSnapshots = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const data = await listSnapshots(profileId);
      setSnapshots(data);
      if (data.length > 0) setActiveSnapId(data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadNodes = async (snapId: string) => {
    if (!profileId) return;
    try {
      const data = await browseSnapshot(profileId, snapId);
      setNodes(data);
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <>
      <TopBar
        breadcrumb={["Profile", "Snapshots"]}
        title="Snapshots"
        sub={`${snapshots.length} snapshots stored`}
        actions={
          <>
            <button className="btn" onClick={loadSnapshots}>
              <IconRefresh size={12} /> {loading ? "Loading..." : "Refresh"}
            </button>
          </>
        }
      />
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            className="scroll"
            style={{ flex: 1, overflow: "auto", padding: "8px 8px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {snapshots.map((s) => (
                <SnapshotItem key={s.id} s={s} active={activeSnapId === s.id} onClick={() => setActiveSnapId(s.id!)} />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            className="scroll"
            style={{ flex: 1, overflow: "auto", padding: 8 }}
          >
            {nodes.length === 0 ? <div style={{padding: 20, color: "var(--text-3)"}}>Select a snapshot to browse or no files.</div> : (
              nodes.map((node, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: 8, borderBottom: '1px solid var(--border)' }}>
                   {node.node_type === 'dir' ? <IconFolder size={14} color="var(--gold)"/> : <IconFile size={14} color="var(--text-3)"/>}
                   <span>{node.name}</span>
                   <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-4)"}}>{node.size} bytes</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SnapshotBrowser.tsx
git commit -m "feat: hook up snapshot browser to backend data"
```

---

### Task 5: RunHistory and Settings Integration (Optional follow-ups)

*Can be left out for a separate task, as hooking up dashboard and snapshots covers the primary functional requirements.*
