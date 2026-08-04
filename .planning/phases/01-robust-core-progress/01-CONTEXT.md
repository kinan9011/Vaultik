# Phase 1: Robust Core & Progress - Context

**Gathered:** May 19, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can reliably run backups, monitor progress accurately, and handle multiple profiles.

</domain>

<decisions>
## Implementation Decisions

### Progress Monitoring UX
- Display backup progress as a smooth progress bar with percentage, parsed from restic's JSON status output.
- Display an "Indeterminate" loading state while continuing to run the backup if progress parsing temporarily fails.
- Hide detailed file-by-file logs behind an "Advanced/Details" toggle to keep the main view clean.
- Throttle UI progress updates to ~500ms to avoid overwhelming React renders and Tauri IPC.

### Multiple Profile Handling
- Switch between active profiles using a dropdown/select component prominently in the Sidebar or Header.
- Enforce one active run at a time (block or queue) to prevent UI/state complexity.
- Load profile config from the Rust backend via Tauri command on mount, store in Zustand.
- Block profile switching (disable the dropdown) until the backup completes.

### Error Handling & Display
- Show critical restic errors via a dedicated Error Banner/Modal describing the issue clearly, avoiding raw stack traces.
- Offer an "Unlock Repository" button next to the error if a lock error is detected.
- Display warnings as non-blocking toast notifications.
- Log failed backups with a "Failed" status in the history DB (handled by Rust).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `App.tsx`, `main.tsx` as standard React entry points.
- `src/components/` and `src/pages/Dashboard.tsx` for visual scaffolding.
- `src/store/index.ts` for Zustand state setup.
- `src/lib/tauri.ts` for existing IPC bindings.

### Established Patterns
- Zustand for global state management.
- Tailwind CSS v4 for styling.
- Tauri IPC commands located in `src-tauri/src/commands.rs`.
- Background task processes orchestrated in `src-tauri/src/restic/`.

### Integration Points
- Frontend UI (`Dashboard.tsx`) integrates with Rust backend (`restic/executor.rs`) via Tauri commands.
- Zustand store (`store/index.ts`) must capture real-time progress events from Tauri.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
