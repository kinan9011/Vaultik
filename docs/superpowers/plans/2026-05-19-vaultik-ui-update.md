# Vaultik UI Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the new UI design from `docs/Design/project/` into the Vaultik React/Tauri codebase.

**Architecture:** We will convert the JSX prototype files into strongly typed React components in the `src/` directory. We'll use the vanilla CSS provided in `docs/Design/project/styles.css` by merging it into `src/styles.css`. The `Shell` layout will wrap the router routes in `src/App.tsx`.

**Tech Stack:** React, TypeScript, Vite, Tauri v2, Vanilla CSS.

---

### Task 1: Setup CSS Design System

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace styles.css content**
    Replace the contents of `src/styles.css` with the design system CSS from `docs/Design/project/styles.css`, keeping any Tailwind imports at the top if needed (though the design relies mostly on vanilla CSS).

```css
@import "tailwindcss";

/* Vaultik design system */
:root {
  /* Surfaces — cool slate, near-black background */
  --bg: #0a0c11;
  --bg-2: #0e1117;
  --surface: #14181f;
  --surface-2: #1a1f28;
  --surface-3: #20262f;
  --border: #252b36;
  --border-strong: #313a47;

  /* Text */
  --text: #e8ebf2;
  --text-2: #b6bdcc;
  --text-3: #7d8696;
  --text-4: #565e6d;

  /* Brand — warm vault gold + emerald accent */
  --gold: #e8b96a;
  --gold-2: #f0c986;
  --gold-dim: #8a6f3d;

  --accent: #34d399;        /* primary action / healthy */
  --accent-2: #10b981;
  --accent-soft: rgba(52, 211, 153, 0.12);
  --accent-line: rgba(52, 211, 153, 0.32);

  --info: #60a5fa;
  --info-soft: rgba(96, 165, 250, 0.12);
  --warn: #fbbf24;
  --warn-soft: rgba(251, 191, 36, 0.12);
  --danger: #f87171;
  --danger-soft: rgba(248, 113, 113, 0.12);

  /* Type */
  --font-sans: "Geist", "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "Geist Mono", "JetBrains Mono", ui-monospace, monospace;

  /* Radii */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 18px;
  --r-2xl: 22px;

  /* Shadows */
  --shadow-card: 0 1px 0 0 rgba(255, 255, 255, 0.03) inset,
                 0 1px 2px rgba(0, 0, 0, 0.4),
                 0 8px 24px rgba(0, 0, 0, 0.25);
  --shadow-pop: 0 12px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--border);
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "ss01", "cv11";
}

/* Desktop window shell */
.v-app {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 248px 1fr;
  background: var(--bg);
  color: var(--text);
  font-size: 13.5px;
  overflow: hidden;
}

/* Sidebar */
.v-side {
  background: linear-gradient(180deg, #0b0e14 0%, #0a0c11 100%);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.v-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 14px;
}
.v-brand-mark {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: linear-gradient(160deg, #2a2118 0%, #1a1410 100%);
  border: 1px solid #3a2e1d;
  display: grid; place-items: center;
  box-shadow: 0 0 0 1px rgba(232, 185, 106, 0.08), 0 4px 12px rgba(232, 185, 106, 0.12);
}
.v-brand-name {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: var(--text);
}
.v-brand-tag {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-4);
  letter-spacing: 0.04em;
}

.v-nav { padding: 6px 10px; display: flex; flex-direction: column; gap: 1px; }
.v-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  color: var(--text-2);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  user-select: none;
  text-decoration: none;
}
.v-nav-item:hover { background: var(--surface); color: var(--text); }
.v-nav-item.active {
  background: var(--surface-2);
  color: var(--text);
  box-shadow: inset 0 0 0 1px var(--border);
}
.v-nav-item .v-nav-icon {
  width: 16px; height: 16px;
  color: var(--text-3);
  flex-shrink: 0;
}
.v-nav-item.active .v-nav-icon { color: var(--gold); }
.v-nav-badge {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-4);
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.03);
}

.v-section-label {
  padding: 16px 18px 6px;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-4);
}

.v-side-foot {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid var(--border);
}
.v-restic-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 12px;
  color: var(--text-2);
}
.v-restic-pill .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
}
.v-restic-pill .ver {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
}

/* Main */
.v-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: var(--bg);
}
.v-top {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(10, 12, 17, 0.7);
  backdrop-filter: blur(8px);
}
.v-top-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.v-top-sub {
  color: var(--text-3);
  font-size: 12.5px;
}
.v-top-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.v-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--r-sm);
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.btn:hover:not(:disabled) { background: var(--surface-2); border-color: var(--border-strong); }
.btn-primary {
  background: var(--accent);
  border-color: transparent;
  color: #04221a;
  font-weight: 600;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-2); }
.btn-gold {
  background: linear-gradient(180deg, var(--gold-2) 0%, var(--gold) 100%);
  border-color: rgba(0,0,0,0.2);
  color: #1a1304;
  font-weight: 600;
}
.btn-ghost { background: transparent; }
.btn-ghost:hover:not(:disabled) { background: var(--surface); }
.btn-danger { color: var(--danger); }
.btn-icon {
  width: 30px; height: 30px;
  padding: 0;
  justify-content: center;
  color: var(--text-3);
}
.btn-icon:hover:not(:disabled) { color: var(--text); }
.btn-sm { padding: 4px 8px; font-size: 11.5px; }
.btn-lg { padding: 10px 16px; font-size: 13px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Cards */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
}
.card-head {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-title { font-weight: 600; font-size: 13.5px; }
.card-sub { color: var(--text-3); font-size: 12px; }
.card-body { padding: 16px 18px; }

/* Status pieces */
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.healthy { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.status-dot.warn { background: var(--warn); box-shadow: 0 0 8px var(--warn); }
.status-dot.fail { background: var(--danger); box-shadow: 0 0 8px var(--danger); }
.status-dot.idle { background: var(--text-4); }
.status-dot.paused { background: var(--text-4); opacity: 0.6; }
.status-dot.running { background: var(--info); box-shadow: 0 0 8px var(--info); animation: pulse 1.6s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--font-sans);
  background: var(--surface-2);
  color: var(--text-2);
  border: 1px solid var(--border);
}
.badge.healthy { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-line); }
.badge.warn { background: var(--warn-soft); color: var(--warn); border-color: rgba(251,191,36,0.32); }
.badge.fail { background: var(--danger-soft); color: var(--danger); border-color: rgba(248,113,113,0.32); }
.badge.info { background: var(--info-soft); color: var(--info); border-color: rgba(96,165,250,0.32); }
.badge.paused { background: var(--surface-2); color: var(--text-3); }

/* Form */
.field { display: flex; flex-direction: column; gap: 6px; }
.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
}
.hint { font-size: 11.5px; color: var(--text-4); }
.input, .select, .textarea {
  width: 100%;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 8px 10px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text);
  outline: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.input:focus, .select:focus, .textarea:focus {
  border-color: var(--accent-line);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.input.mono { font-family: var(--font-mono); font-size: 12px; }
.row { display: flex; gap: 10px; align-items: center; }

/* Toggle */
.toggle {
  position: relative;
  width: 32px; height: 18px;
  border-radius: 100px;
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  cursor: pointer;
  transition: background 0.15s;
}
.toggle::after {
  content: "";
  position: absolute;
  top: 1px; left: 1px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--text-2);
  transition: transform 0.18s ease, background 0.15s;
}
.toggle.on { background: var(--accent); border-color: var(--accent); }
.toggle.on::after { transform: translateX(14px); background: #04221a; }

/* Misc helpers */
.mono { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-2); }
.kbd {
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-3);
}

.divider { height: 1px; background: var(--border); }

/* Progress bar */
.bar {
  width: 100%;
  height: 6px;
  background: var(--surface-2);
  border-radius: 100px;
  overflow: hidden;
  position: relative;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
  border-radius: 100px;
  position: relative;
}
.bar-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%);
  animation: shimmer 2.2s linear infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Scrollbar */
.v-body::-webkit-scrollbar,
.scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.v-body::-webkit-scrollbar-thumb,
.scroll::-webkit-scrollbar-thumb { background: var(--surface-2); border-radius: 4px; }
.v-body::-webkit-scrollbar-track,
.scroll::-webkit-scrollbar-track { background: transparent; }
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Passes without errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: apply new vaultik design system css"
```

---

### Task 2: Create Icons Component

**Files:**
- Create: `src/components/Icons.tsx`

- [ ] **Step 1: Write Icons component from `icons.jsx`**
    Create `src/components/Icons.tsx` and copy the SVG icon declarations from `docs/Design/project/icons.jsx`. Make sure they are correctly typed for TypeScript (e.g., using `React.SVGProps<SVGSVGElement>`).

- [ ] **Step 2: Verify component builds**

Run: `npm run build`
Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/Icons.tsx
git commit -m "feat: add icons component from prototype"
```

---

### Task 3: Create Shell Components

**Files:**
- Create/Modify: `src/components/Shell.tsx`
- Note: This will replace the existing `src/components/Sidebar.tsx`.

- [ ] **Step 1: Write `Shell.tsx`**
    Create `src/components/Shell.tsx` and copy the logic for the `Sidebar` and `TopBar` components from `docs/Design/project/shell.jsx`. Use `react-router-dom` `NavLink` components for the links in the Sidebar to correctly highlight active items based on location.

- [ ] **Step 2: Verify code**

Run: `npm run build`
Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/Shell.tsx
git commit -m "feat: add shell components (Sidebar, TopBar)"
```

---

### Task 4: Port Core App Component

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/Sidebar.tsx` (optional)

- [ ] **Step 1: Rewrite App.tsx**
    Change `src/App.tsx` to use the new `Shell.tsx` `Sidebar` instead of `src/components/Sidebar.tsx`. Add `<div className="v-app">` to wrap everything according to the design system layout constraints. The routes will live inside `<div className="v-main">`.

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git rm src/components/Sidebar.tsx
git commit -m "refactor: integrate new shell layout into app"
```

---

### Task 5: Port Dashboard Screen

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Write `src/pages/Dashboard.tsx` using `docs/Design/project/screens/dashboard.jsx`**
    You will need to manually port the prototype JSX to TypeScript, ensuring the `TopBar` is imported from `../components/Shell` and icons from `../components/Icons`. The dashboard uses `ActiveBackupCard`, `HealthSummary`, and `ProfileCard`. Use the provided `SAMPLE_PROFILES` array to render dummy data. Ensure that classes and styles map correctly. Remove `window.Screens.Dashboard` assignment.

- [ ] **Step 2: Verify component builds**

Run: `npm run build`
Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: port dashboard screen from prototype"
```

---

### Task 6: Port Other Screens

**Files:**
- Modify: `src/pages/Wizard.tsx`
- Modify: `src/pages/SnapshotBrowser.tsx`
- Modify: `src/pages/ProfileEditor.tsx`
- Modify: `src/pages/RunHistory.tsx`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Port each file**
    For each screen, copy the JSX from `docs/Design/project/screens/*.jsx` into the corresponding `src/pages/*.tsx`.
    - Replace `window.Icons` and `window.Shell` with imports from `../components/Icons` and `../components/Shell`.
    - Extract any inline dummy data into local component constants.
    - Convert any missing HTML properties to React props (e.g. `class` to `className`, `style` string mappings to objects if needed—the prototypes already use React `style` objects, so this shouldn't be much work).

- [ ] **Step 2: Verify builds**

Run: `npm run build`
Expected: Build passes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/
git commit -m "feat: port all remaining screens from design prototype"
```

---

### Task 7: Cleanup & Final Verification

- [ ] **Step 1: Final review**
    Check that `npm run build` completely passes and the Tauri application can start if run. Make sure that no prototype JS files from the `docs/Design/project/` leak into the actual production bundle.

- [ ] **Step 2: Commit**
    Commit any lingering adjustments.
