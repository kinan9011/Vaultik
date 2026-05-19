# Project Roadmap

## Phases
- [ ] **Phase 1: Robust Core & Progress** - Reliable execution and monitoring of backups.
- [ ] **Phase 2: Snapshot Browsing & Restore** - Enabling seamless data recovery.
- [ ] **Phase 3: Scheduling & Background Execution** - Automating backups without user intervention.
- [ ] **Phase 4: Global Settings & Configuration** - Providing system-level controls.
- [ ] **Phase 5: Desktop Polish** - Integrating deeply with the host OS.

## Phase Details

### Phase 1: Robust Core & Progress
**Goal**: Users can reliably run backups, monitor progress accurately, and handle multiple profiles.
**Depends on**: None
**Requirements**: CORE-01, CORE-02, CORE-03
**Success Criteria** (what must be TRUE):
  1. User can switch between multiple backup profiles.
  2. User sees a responsive progress bar and stats during an active backup run.
  3. User is presented with clear, actionable error messages if a backup fails.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Snapshot Browsing & Restore
**Goal**: Users can navigate their backed-up data and recover specific files.
**Depends on**: Phase 1
**Requirements**: REST-01, REST-02
**Success Criteria** (what must be TRUE):
  1. User can view a chronological list of snapshots.
  2. User can browse the contents of a snapshot in a file tree structure.
  3. User can restore a selected file or folder to their local disk.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Scheduling & Background Execution
**Goal**: Users can set up automated backup schedules that run reliably.
**Depends on**: Phase 1
**Requirements**: SCHED-01, SCHED-02
**Success Criteria** (what must be TRUE):
  1. User can define a recurring schedule for a backup profile.
  2. Backups trigger automatically at the scheduled time.
  3. Backups run successfully even if the main application window is closed.
**Plans**: TBD

### Phase 4: Global Settings & Configuration
**Goal**: Users can customize their overall application experience and tooling paths.
**Depends on**: None
**Requirements**: SET-01, SET-02
**Success Criteria** (what must be TRUE):
  1. User can change the application theme (light/dark/system).
  2. User can specify a custom path to the restic executable.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Desktop Polish
**Goal**: Users experience a native-feeling desktop application.
**Depends on**: Phase 3
**Requirements**: POL-01, POL-02
**Success Criteria** (what must be TRUE):
  1. User can see an icon in the system tray indicating application state.
  2. User receives a native OS notification when a scheduled backup completes or fails.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Robust Core & Progress | 0/0 | Not started | - |
| 2. Snapshot Browsing & Restore | 0/0 | Not started | - |
| 3. Scheduling & Background Execution | 0/0 | Not started | - |
| 4. Global Settings & Configuration | 0/0 | Not started | - |
| 5. Desktop Polish | 0/0 | Not started | - |
