import { invoke } from "@tauri-apps/api/core";
import type {
  BackupProfile,
  ProfileSummary,
  Snapshot,
  LsNode,
  RunRecord,
  Schedule,
} from "./types";

// ── Profile commands ──────────────────────────────────────────────

export async function listProfiles(): Promise<ProfileSummary[]> {
  return invoke("list_profiles");
}

export async function getProfile(id: string): Promise<BackupProfile> {
  return invoke("get_profile", { id });
}

export async function createProfile(
  profile: BackupProfile,
  repoPassword?: string,
): Promise<string> {
  return invoke("create_profile", { profile, repoPassword });
}

export async function updateProfile(profile: BackupProfile): Promise<void> {
  return invoke("update_profile", { profile });
}

export async function deleteProfile(id: string): Promise<void> {
  return invoke("delete_profile", { id });
}

// ── Repository commands ───────────────────────────────────────────

export async function initRepo(
  repoUrl: string,
  repoPassword: string,
): Promise<string> {
  return invoke("init_repo", { repoUrl, repoPassword });
}

export async function testRepo(profile: BackupProfile): Promise<string> {
  return invoke("test_repo", { profile });
}

// ── Backup commands ───────────────────────────────────────────────

export async function runBackup(profileId: string): Promise<string> {
  return invoke("run_backup", { profileId });
}

export async function cancelOperation(runId: string): Promise<boolean> {
  return invoke("cancel_operation", { runId });
}

// ── Snapshot commands ─────────────────────────────────────────────

export async function listSnapshots(
  profileId: string,
): Promise<Snapshot[]> {
  return invoke("list_snapshots", { profileId });
}

export async function browseSnapshot(
  profileId: string,
  snapshotId: string,
): Promise<LsNode[]> {
  return invoke("browse_snapshot", { profileId, snapshotId });
}

// ── Restore commands ──────────────────────────────────────────────

export async function runRestore(
  profileId: string,
  snapshotId: string,
  target: string,
  includes: string[],
  excludes: string[],
  verify: boolean,
): Promise<string> {
  return invoke("run_restore", {
    profileId,
    snapshotId,
    target,
    includes,
    excludes,
    verify,
  });
}

// ── Forget commands ───────────────────────────────────────────────

export async function forgetSnapshots(
  profileId: string,
  snapshotIds: string[],
): Promise<string> {
  return invoke("forget_snapshots", { profileId, snapshotIds });
}

// ── Check commands ────────────────────────────────────────────────

export async function runCheck(
  profileId: string,
  readDataSubset?: string,
): Promise<string> {
  return invoke("run_check", { profileId, readDataSubset });
}

// ── Pause/Resume commands ─────────────────────────────────────────

export async function togglePause(profileId: string): Promise<boolean> {
  return invoke("toggle_pause", { profileId });
}

// ── History commands ──────────────────────────────────────────────

export async function getRunHistory(
  profileId?: string,
  limit?: number,
): Promise<RunRecord[]> {
  return invoke("get_run_history", { profileId, limit });
}

// ── Utility commands ──────────────────────────────────────────────

export async function getResticVersion(): Promise<string> {
  return invoke("get_restic_version");
}

// ── Export / Import commands ──────────────────────────────────────

export interface ImportResult {
  imported: number;
  skipped: number;
  names: string[];
}

export async function exportProfiles(
  profileIds: string[],
  path: string,
): Promise<number> {
  return invoke("export_profiles", { profileIds, path });
}

export async function importProfiles(path: string): Promise<ImportResult> {
  return invoke("import_profiles", { path });
}

// ── Schedule commands ─────────────────────────────────────────────

export async function setSchedule(
  profileId: string,
  schedule: Schedule,
): Promise<void> {
  return invoke("set_schedule", { profileId, schedule });
}

export async function removeSchedule(profileId: string): Promise<void> {
  return invoke("remove_schedule", { profileId });
}
