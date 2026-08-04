---
phase: 01-robust-core-progress
plan: 02
subsystem: ui
tags:
  - active-run-view
  - error-banner
  - dashboard
dependency_graph:
  requires:
    - 01-01
  provides:
    - active-run-feedback
    - error-feedback
  affects:
    - dashboard-ui
tech_stack:
  added: []
  patterns:
    - global-state-integration
    - contextual-feedback
key_files:
  created:
    - src/components/ActiveRunView.tsx
    - src/components/ErrorBanner.tsx
  modified:
    - src/pages/Dashboard.tsx
decisions:
  - Integrated `ActiveRunView` and `ErrorBanner` at the top of the dashboard for optimal visibility.
metrics:
  duration: 120s
  completed_date: 2025-05-19
---

# Phase 1 Plan 2: Feedback Components Summary

Implemented primary visual feedback mechanisms for active runs and errors.

## Key Changes
- Created `ActiveRunView` component that renders progress stats from `useAppStore`, showing a progress bar, elapsed items/bytes, and a togglable advanced details view for logs. Implemented an indeterminate state if progress halts for more than 2 seconds.
- Created `ErrorBanner` component to handle `failed` and `locked` states, rendering contextual error messages and a dedicated "Unlock Repository" button when a repository lock is encountered.
- Integrated both components into `Dashboard.tsx`, ensuring they seamlessly take over UI hierarchy when an active or failed run exists.
- Linked "Run now" buttons in the profile cards to the `useAppStore`'s `startRun` method.

## Deviations from Plan
- None - plan executed exactly as written.

## Threat Flags
None.

## Known Stubs
None.

## Self-Check: PASSED
- `ActiveRunView.tsx` created and tracking global store.
- `ErrorBanner.tsx` created and tracking global store.
- Integrated into `Dashboard.tsx`.
- Commits created and `npm run build` succeeds.
