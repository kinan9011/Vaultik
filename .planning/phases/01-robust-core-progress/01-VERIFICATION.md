# Phase 1 Verification

status: human_needed

## Automated Checks
- `npm run build` succeeds without TS errors.
- Global state tracks active profile and run state.
- Components are cleanly structured and integrated.

## Human Verification
1. Open the application.
2. Select a profile from the dropdown in the sidebar.
3. Click "Run Backup" and ensure the active run view replaces the recent run lists.
4. Verify the dropdown and button are disabled during the run.
5. Verify progress bar updates dynamically.
6. Verify an ErrorBanner is displayed if the backup fails (e.g. invalid repository path).