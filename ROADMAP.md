# Restic Desktop GUI — Roadmap

## Vision

A "boringly reliable" desktop application for restic backups. Sources → repo → retention → test restore, with health checks and clear failure reasons. The GUI wraps the restic CLI (via `--json` output) rather than linking to restic as a library.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Tauri Shell                       │
│  ┌───────────────────────────────────────────────┐  │
│  │              Web UI (React + TS)              │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │ Wizard  │ │ Profiles │ │  Snapshots    │  │  │
│  │  │  Flow   │ │  Editor  │ │  Browser      │  │  │
│  │  ├─────────┤ ├──────────┤ ├───────────────┤  │  │
│  │  │Schedule │ │ Run Now  │ │Restore Picker │  │  │
│  │  │  View   │ │ + Logs   │ │  + Progress   │  │  │
│  │  └─────────┘ └──────────┘ └───────────────┘  │  │
│  │                                               │  │
│  │  Shared: ProgressBar, Notifications, Theme    │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │ Tauri IPC (invoke / events)        │
│  ┌──────────────▼────────────────────────────────┐  │
│  │           Rust Backend (tauri plugin)          │  │
│  │                                                │  │
│  │  ┌────────────┐  ┌─────────────┐              │  │
│  │  │  Restic     │  │  Profile    │              │  │
│  │  │  Process    │  │  Store      │              │  │
│  │  │  Manager    │  │  (JSON/DB)  │              │  │
│  │  ├────────────┤  ├─────────────┤              │  │
│  │  │ JSON line  │  │  Schedule   │              │  │
│  │  │ parser +   │  │  Manager    │              │  │
│  │  │ event      │  │  (systemd / │              │  │
│  │  │ emitter    │  │  launchd /  │              │  │
│  │  │            │  │  Task Sched)│              │  │
│  │  ├────────────┤  ├─────────────┤              │  │
│  │  │ Password   │  │ Notification│              │  │
│  │  │ Keyring    │  │ Dispatcher  │              │  │
│  │  └────────────┘  └─────────────┘              │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

         │                              │
         ▼                              ▼
   restic CLI binary             OS scheduler
   (spawned as child             (systemd timer /
    process w/ --json)            launchd plist /
                                  Task Scheduler)
```

### Core Principle: CLI Wrapper, Not Library Binding

The Rust backend spawns `restic` as a child process with `--json` and parses streaming JSON lines from stdout. This means:

- Any installed restic binary works (user brings their own, or we bundle one)
- All restic features are available without re-implementation
- Upgrade restic independently of the GUI
- Exit codes (0/1/3/10/11/12) drive error reporting

### Key Data Flows

**Backup run:**
```
UI "Run Now" → Tauri invoke → Rust spawns `restic backup --json ...`
  → stdout parsed line-by-line (message_type: status/verbose_status/error/summary)
  → each line → Tauri event → UI progress bar updates
  → on exit: code 0 = success, 3 = partial (warnings), 1 = fail
  → summary event → stored in run history → notification dispatched
```

**Snapshot browse:**
```
UI opens browser → invoke get_snapshots
  → Rust runs `restic snapshots --json`
  → returns Vec<Snapshot> to UI
  → user clicks snapshot → invoke ls_snapshot(id)
  → Rust runs `restic ls --json <id>` → streams tree to UI
```

**Restore:**
```
UI selects files + target dir → invoke restore(id, includes, target)
  → Rust runs `restic restore --json <id> -t <target> -i <patterns>...`
  → progress events streamed to UI
  → optional: --verify after restore completes
```

---

## Data Model

### Backup Profile (stored as JSON on disk)

```rust
struct BackupProfile {
    id: Uuid,
    name: String,                    // "Laptop Daily", "Photos"

    // Repository
    repo_url: String,                // "s3:s3.amazonaws.com/bucket" | "/mnt/backup" | ...
    password_storage: PasswordStorage, // Keyring | File | Command
    backend_options: Vec<(String, String)>,  // -o key=value pairs

    // Sources
    sources: Vec<PathBuf>,           // directories/files to back up
    excludes: Vec<String>,           // --exclude patterns
    exclude_caches: bool,
    exclude_if_present: Vec<String>,
    exclude_larger_than: Option<String>,
    one_file_system: bool,

    // Snapshot metadata
    tags: Vec<String>,
    host_override: Option<String>,

    // Retention policy
    retention: RetentionPolicy,
    auto_prune: bool,                // --prune after forget

    // Schedule
    schedule: Option<Schedule>,

    // Health checks
    check_after_backup: bool,        // run `check` after each backup
    check_read_data_subset: Option<String>, // e.g. "5%"

    // Performance
    compression: Option<String>,     // auto|off|fastest|better|max
    upload_limit_kib: Option<u32>,
    download_limit_kib: Option<u32>,
    read_concurrency: Option<u32>,
}

enum PasswordStorage {
    Keyring { service: String, account: String },
    File { path: PathBuf },
    Command { command: String },
}

struct RetentionPolicy {
    keep_last: Option<i32>,          // -1 = unlimited
    keep_hourly: Option<i32>,
    keep_daily: Option<i32>,
    keep_weekly: Option<i32>,
    keep_monthly: Option<i32>,
    keep_yearly: Option<i32>,
    keep_within: Option<String>,     // "1y5m7d" format
    keep_tags: Vec<String>,
}

struct Schedule {
    kind: ScheduleKind,              // Hourly | Daily | Weekly | Custom(cron)
    time: Option<NaiveTime>,         // for daily/weekly
    day_of_week: Option<Weekday>,    // for weekly
    cron_expr: Option<String>,       // for custom
    retry_on_failure: bool,
    notify_on_success: bool,
    notify_on_failure: bool,
}
```

### Run History (stored in SQLite)

```sql
CREATE TABLE run_history (
    id          INTEGER PRIMARY KEY,
    profile_id  TEXT NOT NULL,
    started_at  TEXT NOT NULL,
    finished_at TEXT,
    trigger     TEXT NOT NULL,        -- "manual" | "scheduled" | "startup"
    operation   TEXT NOT NULL,        -- "backup" | "check" | "forget" | "prune" | "restore"
    exit_code   INTEGER,
    snapshot_id TEXT,                 -- for backup operations
    summary     TEXT,                 -- JSON blob (the summary message_type output)
    errors      TEXT,                 -- JSON array of error messages
    log_path    TEXT                  -- path to full log file
);
```

---

## Phases

### Phase 0 — Project Scaffold (Week 1)

**Goal:** Empty Tauri app builds and launches on Linux, macOS, Windows.

- [ ] Initialize Tauri v2 project with React + TypeScript frontend
- [ ] Rust workspace layout:
  ```
  gui/
  ├── src-tauri/
  │   ├── Cargo.toml
  │   ├── src/
  │   │   ├── main.rs
  │   │   ├── restic/          # restic CLI wrapper module
  │   │   │   ├── mod.rs
  │   │   │   ├── process.rs   # spawn + stream JSON lines
  │   │   │   ├── types.rs     # Rust structs matching restic JSON
  │   │   │   └── error.rs     # exit code → error mapping
  │   │   ├── profile/         # profile CRUD + persistence
  │   │   ├── schedule/        # OS scheduler integration
  │   │   ├── password/        # keyring integration
  │   │   └── commands.rs      # Tauri IPC command handlers
  │   └── tauri.conf.json
  ├── src/                     # React frontend
  │   ├── App.tsx
  │   ├── components/
  │   ├── pages/
  │   ├── hooks/
  │   └── lib/
  ├── package.json
  └── ROADMAP.md               # this file
  ```
- [ ] CI: build for all 3 platforms (GitHub Actions)
- [ ] Dev tooling: `cargo fmt`, `cargo clippy`, `eslint`, `prettier`

**Exit criteria:** `cargo tauri dev` opens a window on all 3 platforms.

---

### Phase 1 — Restic Process Manager (Week 2)

**Goal:** Rust backend can invoke any restic command, stream JSON output, and report exit status.

- [ ] `ResticCommand` builder: constructs CLI args from typed Rust structs
  ```rust
  ResticCommand::backup()
      .repo("s3:...")
      .password_file("/tmp/pw")
      .json(true)
      .sources(&["/home/user/docs"])
      .exclude(&["*.tmp"])
      .build()   // → Vec<String> of CLI args
  ```
- [ ] `ResticProcess`: spawns restic, line-reads stdout, deserializes each JSON line
  - Emits typed events: `BackupStatus`, `BackupSummary`, `BackupError`, etc.
  - Captures stderr for unexpected errors
  - Returns exit code with semantic mapping:
    - 0 → `Ok`
    - 3 → `PartialSuccess { warnings }`
    - 10 → `RepoNotFound`
    - 11 → `RepoLocked`
    - 12 → `WrongPassword`
    - 1 → `Failed { stderr }`
- [ ] Deserialize all JSON output types into Rust structs:
  - Backup: `statusUpdate`, `verboseUpdate`, `errorUpdate`, `summaryOutput`
  - Restore: `statusUpdate`, `verboseUpdate`, `summaryOutput`
  - Snapshots: `Vec<Snapshot>` or `Vec<SnapshotGroup>`
  - Ls: streaming `lsSnapshot` + `lsNode`
  - Stats: `statsContainer`
  - Check: progress + `checkSummary`
  - Init: `initSuccess`
  - Forget: `Vec<ForgetGroup>`
- [ ] Unit tests: mock restic binary (shell script that outputs canned JSON), verify parsing
- [ ] Restic binary discovery: `PATH` lookup, config override, bundled fallback

**Exit criteria:** `cargo test` passes with all JSON output types parsed correctly.

---

### Phase 2 — Profile Store + Repo Init (Week 3)

**Goal:** Create, edit, delete backup profiles. Initialize new repositories.

**Rust backend:**
- [ ] Profile CRUD: save/load profiles as JSON in `~/.config/restic-gui/profiles/`
- [ ] Password keyring integration via `keyring` crate (libsecret/Keychain/Credential Manager)
- [ ] Tauri commands:
  - `create_profile(profile) → ProfileId`
  - `update_profile(id, profile)`
  - `delete_profile(id)`
  - `list_profiles() → Vec<ProfileSummary>`
  - `get_profile(id) → BackupProfile`
  - `init_repo(repo_url, password) → Result<RepoId>`
  - `test_repo(repo_url, password) → Result<RepoStats>`

**Frontend:**
- [ ] Profile list page (sidebar or cards)
- [ ] Profile editor form:
  - Repository URL input with backend-type selector (local / S3 / B2 / SFTP / REST / Azure / GCS / Swift / rclone)
  - Backend-specific fields (bucket, endpoint, credentials)
  - Password field (stored in keyring)
  - Source directory picker (native file dialog via Tauri)
  - Exclude patterns editor (list with add/remove)
  - Toggles: exclude-caches, one-file-system
  - Tags input
- [ ] "Init Repository" dialog (for new repos)
- [ ] "Test Connection" button → calls `restic snapshots --json` → shows success/error

**Exit criteria:** Can create a profile pointing at a local repo, init the repo, and verify the connection.

---

### Phase 3 — Backup: Run Now + Live Progress (Week 4-5)

**Goal:** Run a backup from a profile, show real-time progress, store run history.

**Rust backend:**
- [ ] `run_backup(profile_id) → RunId` — starts backup in background tokio task
- [ ] Stream `BackupProgress` events to frontend via Tauri event system:
  ```rust
  enum BackupProgress {
      Scanning { total_files: u64, total_bytes: u64 },
      Status { percent_done: f64, files_done: u64, bytes_done: u64,
               current_files: Vec<String>, seconds_remaining: u64 },
      FileProcessed { action: String, path: String, size: u64 },
      Error { message: String, path: String, during: String },
      Summary { snapshot_id: String, files_new: u64, data_added: u64,
                duration: f64 },
  }
  ```
- [ ] `cancel_backup(run_id)` — sends SIGTERM/SIGINT to restic process
- [ ] SQLite run history (via `rusqlite`): store start time, end time, exit code, summary, errors
- [ ] Optional: auto-run `restic forget` with retention policy after successful backup
- [ ] Optional: auto-run `restic check --read-data-subset` after backup

**Frontend:**
- [ ] "Run Now" button on profile card/page
- [ ] Live progress view:
  - Overall progress bar (percent_done)
  - Files processed counter
  - Bytes transferred counter
  - ETA display
  - Current file(s) being processed
  - Error count badge (expandable to see errors)
  - Elapsed time
- [ ] Run log: scrollable list of verbose file actions
- [ ] Cancel button
- [ ] Summary card on completion (files new/changed/unchanged, data added, duration)

**Exit criteria:** Can run a backup of a local directory to a local repo, see live progress, and see the completed run in history.

---

### Phase 4 — Snapshot Browser + Restore (Week 6-7)

**Goal:** Browse snapshots and their contents. Restore selected files to a target directory.

**Rust backend:**
- [ ] `list_snapshots(profile_id, group_by?) → Vec<Snapshot>`
- [ ] `browse_snapshot(profile_id, snapshot_id, path?) → Vec<TreeNode>` — lazy-load tree via `restic ls --json`
- [ ] `restore(profile_id, snapshot_id, target, includes?, excludes?, opts?) → RunId`
  - Streams `RestoreProgress` events
  - Supports `--verify` flag
  - Supports overwrite behavior (always/if-changed/if-newer/never)
- [ ] `forget_snapshots(profile_id, snapshot_ids) → Result`
- [ ] `get_snapshot_diff(profile_id, id_a, id_b) → DiffResult` (via `restic diff --json`)

**Frontend:**
- [ ] Snapshots list page:
  - Table: date, hostname, paths, tags, size, file count
  - Grouping: by host, path, or tags
  - Filter/search
  - Sort by date (default newest first)
- [ ] Snapshot detail / file browser:
  - Tree view (lazy-loaded, expand folders on click)
  - File details: name, size, mode, mtime
  - Breadcrumb navigation
  - Checkbox selection for partial restore
  - "Select all" / "Select none"
- [ ] Restore dialog:
  - Target directory picker
  - Overwrite behavior dropdown
  - Dry-run toggle
  - Verify toggle
  - Progress view (reuse from Phase 3)
- [ ] Snapshot comparison (diff between two snapshots)

**Exit criteria:** Can browse snapshot tree, select files, restore them to a folder, and see restore progress.

---

### Phase 5 — Scheduling (Week 8-9)

**Goal:** Schedule automatic backups using OS-native schedulers.

**Rust backend:**
- [ ] Scheduler abstraction trait:
  ```rust
  trait Scheduler {
      fn install(profile_id: &str, schedule: &Schedule) -> Result<()>;
      fn uninstall(profile_id: &str) -> Result<()>;
      fn list() -> Result<Vec<ScheduledJob>>;
      fn status(profile_id: &str) -> Result<JobStatus>;
  }
  ```
- [ ] **Linux:** systemd user timers (`~/.config/systemd/user/restic-gui-<profile>.timer`)
  - Timer unit + service unit that invokes the GUI's CLI mode: `restic-gui run <profile_id>`
  - `systemctl --user enable/disable/start/stop`
- [ ] **macOS:** launchd user agents (`~/Library/LaunchAgents/com.restic-gui.<profile>.plist`)
- [ ] **Windows:** Task Scheduler (`schtasks.exe` or COM API via `windows-rs`)
- [ ] CLI mode for headless execution: `restic-gui run <profile_id> [--notify]`
  - Loads profile, runs backup, stores history, sends notification, exits
  - Used by OS scheduler — the GUI app doesn't need to be running
- [ ] Tauri commands:
  - `set_schedule(profile_id, schedule)`
  - `remove_schedule(profile_id)`
  - `get_schedule_status(profile_id) → ScheduleStatus`

**Frontend:**
- [ ] Schedule editor in profile settings:
  - Frequency: hourly / daily / weekly / custom cron
  - Time picker (for daily/weekly)
  - Day-of-week picker (for weekly)
  - Cron expression input (for custom, with human-readable preview)
- [ ] Schedule status indicator on profile card: next run time, last triggered time
- [ ] Dashboard "upcoming backups" section

**Exit criteria:** Can schedule a daily backup that runs unattended via systemd timer (Linux) and verify it ran via run history.

---

### Phase 6 — Notifications + Dashboard (Week 10)

**Goal:** Notify users of backup results. Central dashboard for all profiles.

**Rust backend:**
- [ ] Notification dispatcher:
  - **Desktop notifications:** via `notify-rust` crate (freedesktop/macOS/Windows)
  - Success: "Backup 'Laptop Daily' completed — 142 new files, 1.2 GB added"
  - Partial: "Backup 'Laptop Daily' completed with 3 warnings"
  - Failure: "Backup 'Laptop Daily' failed — repository locked"
  - Missed: "Backup 'Laptop Daily' hasn't run in 3 days" (checked on app launch)
- [ ] Health check logic:
  - Flag profiles where last run was > 2× schedule interval ago
  - Flag profiles where last run had errors
  - Flag profiles that have never run `check`

**Frontend:**
- [ ] Dashboard (home page):
  - Profile cards with status badges: ✓ healthy / ⚠ warning / ✗ error / ○ never run
  - Last backup time + next scheduled time per profile
  - Global stats: total data protected, total snapshots
  - "Attention needed" section for failed/overdue profiles
- [ ] Run history page:
  - Filterable by profile, date range, status
  - Expandable rows showing summary + errors
  - Link to full log file
- [ ] Notification preferences in settings:
  - Per-profile: notify on success / failure / both / none
  - Global: notification method (desktop / none; future: email/webhook)

**Exit criteria:** Desktop notification fires after scheduled backup completes. Dashboard shows accurate health status for all profiles.

---

### Phase 7 — Setup Wizard (Week 11)

**Goal:** First-run experience that creates a working backup profile in ~2 minutes.

**Frontend:**
- [ ] Step 1: **Welcome** — "Let's set up your first backup" + detect existing restic binary
- [ ] Step 2: **What to back up** — directory picker, common presets (Home, Documents, code projects)
- [ ] Step 3: **Where to store it** — backend picker:
  - "Local / USB drive" → folder picker
  - "SFTP server" → host, user, path
  - "S3 / MinIO" → endpoint, bucket, key/secret
  - "Backblaze B2" → account ID, key, bucket
  - "Other" → raw repo URL
  - "Existing repo" → connect to existing
- [ ] Step 4: **Security** — set password (saved to keyring), explain encryption
- [ ] Step 5: **Schedule** — frequency picker with recommended default (daily)
- [ ] Step 6: **Retention** — presets:
  - "Conservative": keep 7 daily, 4 weekly, 12 monthly, 3 yearly
  - "Moderate": keep 3 daily, 4 weekly, 6 monthly
  - "Minimal": keep 7 daily, 4 weekly
  - "Custom" → full retention editor
- [ ] Step 7: **Review + Create** — summary, "Create & Run First Backup" button
- [ ] Auto-init repo if new, test connection if existing

**Exit criteria:** New user goes from install to first completed backup in under 3 minutes.

---

### Phase 8 — Polish + Packaging (Week 12-13)

**Goal:** Production-quality UX. Distributable packages.

**UX polish:**
- [ ] Light/dark theme (follow OS preference)
- [ ] Responsive layout (works at 800×600 minimum)
- [ ] Keyboard navigation and accessibility
- [ ] Loading states and skeleton screens
- [ ] Error states with actionable messages:
  - Exit 10: "Repository not found. Check the URL or initialize a new one."
  - Exit 11: "Repository is locked by another process. Retry or force unlock."
  - Exit 12: "Incorrect password. Check your keyring entry."
- [ ] Confirmation dialogs for destructive actions (forget, delete profile)
- [ ] Tray icon with:
  - Status indicator (idle / running / error)
  - Quick actions: run backup, open app
  - Last backup status tooltip

**Packaging:**
- [ ] **Linux:** AppImage + Flatpak + `.deb`
  - Flatpak sandbox permissions: filesystem access, keyring, systemd user session
  - Bundle restic binary or declare dependency
- [ ] **macOS:** `.dmg` with signed app bundle
  - Notarize for Gatekeeper
  - launchd integration for scheduling
- [ ] **Windows:** `.msi` installer via WiX or NSIS
  - Task Scheduler integration
  - Optional: portable `.zip`
- [ ] Auto-update via Tauri's built-in updater (signed releases from GitHub)
- [ ] CI/CD: GitHub Actions builds + signs + publishes for all platforms on tag push

**Exit criteria:** Installable packages for all 3 platforms. Tray icon works.

---

## Milestone Summary

| Phase | Deliverable | Key Risk |
|-------|-------------|----------|
| 0 | Empty Tauri app builds on 3 platforms | Tauri v2 cross-platform quirks |
| 1 | Restic CLI wrapper with full JSON parsing | Edge cases in streaming JSON parse |
| 2 | Profile CRUD + repo init/test | Keyring integration across OSes |
| 3 | Run backup with live progress | Reliable process lifecycle management |
| 4 | Browse snapshots + selective restore | Large tree lazy-loading performance |
| 5 | OS-native scheduling | 3 different scheduler APIs |
| 6 | Notifications + health dashboard | Detecting missed/overdue backups |
| 7 | Setup wizard | UX simplicity vs configurability |
| 8 | Packaging + polish | Code signing, Flatpak sandboxing |

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Restic integration | CLI wrapper via `--json` | No library API; CLI is stable; restic upgrades decouple |
| Frontend framework | React + TypeScript | Largest ecosystem; Tauri has first-class React support |
| State management | Zustand | Lightweight, no boilerplate, good for mid-size apps |
| UI component library | shadcn/ui (Radix + Tailwind) | Accessible, composable, no runtime dependency |
| Rust async runtime | Tokio (Tauri default) | Required by Tauri v2; handles process spawning |
| Local database | SQLite via rusqlite | Run history, lightweight, single-file |
| Password storage | OS keyring via `keyring` crate | Secure default; libsecret/Keychain/Credential Manager |
| Config format | JSON files in XDG config dir | Simple, human-editable, no extra dependency |
| Scheduling | OS-native (systemd/launchd/Task Scheduler) | Runs without GUI; survives reboots; no daemon needed |
| IPC | Tauri invoke (commands) + events (streaming) | Built-in, typed, bidirectional |

---

## Out of Scope (for MVP)

- Email/Slack/webhook notifications (desktop-only for MVP)
- Multi-user / server mode
- Repository repair/maintenance UI beyond `check`
- FUSE mount UI (complex, platform-specific)
- Bandwidth scheduling (peak/off-peak)
- Remote restic server management
- Mobile companion app
- Backup from network shares (user mounts them first)

These can be added post-MVP as the project matures.

---

## File/Folder Conventions

```
gui/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/              # Tauri v2 permission capabilities
│   ├── src/
│   │   ├── main.rs                # entry point
│   │   ├── commands.rs            # all #[tauri::command] handlers
│   │   ├── restic/
│   │   │   ├── mod.rs
│   │   │   ├── cli.rs             # command builder → Vec<String>
│   │   │   ├── process.rs         # spawn, stream JSON, emit events
│   │   │   ├── types.rs           # serde structs for all JSON outputs
│   │   │   └── error.rs           # exit code mapping
│   │   ├── profile/
│   │   │   ├── mod.rs
│   │   │   ├── store.rs           # JSON file CRUD
│   │   │   └── types.rs           # BackupProfile, RetentionPolicy, etc.
│   │   ├── schedule/
│   │   │   ├── mod.rs             # Scheduler trait
│   │   │   ├── systemd.rs         # Linux
│   │   │   ├── launchd.rs         # macOS
│   │   │   └── task_scheduler.rs  # Windows
│   │   ├── history/
│   │   │   ├── mod.rs
│   │   │   └── db.rs              # SQLite run history
│   │   ├── password/
│   │   │   └── mod.rs             # keyring wrapper
│   │   └── notify/
│   │       └── mod.rs             # desktop notifications
│   └── migrations/                # SQLite schema migrations
├── src/
│   ├── main.tsx                   # React entry
│   ├── App.tsx                    # Router + layout
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ProfileEditor.tsx
│   │   ├── SnapshotBrowser.tsx
│   │   ├── RunHistory.tsx
│   │   ├── Settings.tsx
│   │   └── wizard/
│   │       ├── WizardLayout.tsx
│   │       ├── StepSources.tsx
│   │       ├── StepRepository.tsx
│   │       ├── StepSecurity.tsx
│   │       ├── StepSchedule.tsx
│   │       ├── StepRetention.tsx
│   │       └── StepReview.tsx
│   ├── components/
│   │   ├── ProgressBar.tsx
│   │   ├── ProfileCard.tsx
│   │   ├── SnapshotTable.tsx
│   │   ├── FileTree.tsx
│   │   ├── RetentionEditor.tsx
│   │   ├── ScheduleEditor.tsx
│   │   └── BackendFields.tsx
│   ├── hooks/
│   │   ├── useResticEvents.ts     # listen to Tauri events
│   │   ├── useProfiles.ts
│   │   └── useRunHistory.ts
│   └── lib/
│       ├── tauri.ts               # typed invoke wrappers
│       └── types.ts               # shared TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── ROADMAP.md
```
