# Wave 03 Summary: Profile Selector & Safety

**Plan:** `01-03-PLAN.md`

## Completed Tasks
1. **Zustand active profile:** Added `activeProfileId` and `setActiveProfileId` to `useAppStore`.
2. **Profile Selection Dropdown:** Integrated a `<select>` dropdown into `Sidebar` inside `Shell.tsx` mapping over available profiles.
3. **Run Blocking:** Disabled the "Run Backup" button in `Dashboard.tsx` and the profile selector dropdown in `Shell.tsx` when `runState === 'running'`.

## Status
Wave 03 complete. All safety controls and profile switching mechanisms are in place.