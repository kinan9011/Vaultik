// ── Profile types ─────────────────────────────────────────────────

export interface BackupProfile {
  id: string;
  name: string;
  repo_url: string;
  password_storage: PasswordStorage;
  backend_options: [string, string][];
  sources: string[];
  excludes: string[];
  exclude_caches: boolean;
  exclude_if_present: string[];
  exclude_larger_than: string | null;
  one_file_system: boolean;
  tags: string[];
  host_override: string | null;
  retention: RetentionPolicy;
  auto_prune: boolean;
  schedule: Schedule | null;
  paused: boolean;
  check_after_backup: boolean;
  check_read_data_subset: string | null;
  compression: string | null;
  upload_limit_kib: number | null;
  download_limit_kib: number | null;
  read_concurrency: number | null;
}

export interface ProfileSummary {
  id: string;
  name: string;
  repo_url: string;
  source_count: number;
  has_schedule: boolean;
  paused: boolean;
  last_run_at: string | null;
  last_run_exit_code: number | null;
}

export type PasswordStorage =
  | { type: "Keyring"; service: string; account: string }
  | { type: "File"; path: string }
  | { type: "Command"; command: string };

export interface RetentionPolicy {
  keep_last: number | null;
  keep_hourly: number | null;
  keep_daily: number | null;
  keep_weekly: number | null;
  keep_monthly: number | null;
  keep_yearly: number | null;
  keep_within: string | null;
  keep_tags: string[];
}

export interface Schedule {
  kind: "Hourly" | "Daily" | "Weekly" | "Custom";
  time: string | null;
  day_of_week: string | null;
  cron_expr: string | null;
  retry_on_failure: boolean;
  notify_on_success: boolean;
  notify_on_failure: boolean;
}

// ── Snapshot types ────────────────────────────────────────────────

export interface Snapshot {
  id: string | null;
  short_id: string | null;
  time: string;
  parent: string | null;
  tree: string | null;
  paths: string[];
  hostname: string;
  username: string;
  tags: string[];
  program_version: string;
  summary: SnapshotSummary | null;
}

export interface SnapshotSummary {
  backup_start: string | null;
  backup_end: string | null;
  files_new: number;
  files_changed: number;
  files_unmodified: number;
  data_added: number;
  data_added_packed: number;
  total_files_processed: number;
  total_bytes_processed: number;
}

// ── Ls types ──────────────────────────────────────────────────────

export interface LsNode {
  name: string;
  node_type: string;
  path: string;
  uid: number;
  gid: number;
  size: number | null;
  mode: number | null;
  permissions: string;
  mtime: string | null;
  inode: number;
}

// ── Backup progress types ─────────────────────────────────────────

export interface BackupProgressEvent {
  run_id: string;
  message: BackupMessage;
}

export type BackupMessage =
  | { message_type: "status"; percent_done: number; files_done: number;
      bytes_done: number; total_files: number; total_bytes: number;
      seconds_remaining: number; current_files: string[];
      error_count: number; seconds_elapsed: number }
  | { message_type: "verbose_status"; action: string; item: string;
      duration: number; data_size: number }
  | { message_type: "error"; error: unknown; during: string; item: string }
  | { message_type: "summary"; snapshot_id: string; files_new: number;
      files_changed: number; files_unmodified: number; data_added: number;
      data_added_packed: number; total_files_processed: number;
      total_bytes_processed: number; total_duration: number;
      dry_run: boolean };

// ── Restore progress types ────────────────────────────────────────

export interface RestoreProgressEvent {
  run_id: string;
  message: RestoreMessage;
}

export type RestoreMessage =
  | { message_type: "status"; percent_done: number; files_restored: number;
      total_files: number; bytes_restored: number; total_bytes: number;
      seconds_elapsed: number }
  | { message_type: "verbose_status"; action: string; item: string;
      size: number }
  | { message_type: "summary"; files_restored: number; total_files: number;
      bytes_restored: number; total_bytes: number;
      seconds_elapsed: number };

// ── Run history types ─────────────────────────────────────────────

export interface RunRecord {
  id: number;
  profile_id: string;
  started_at: string;
  finished_at: string | null;
  trigger: string;
  operation: string;
  exit_code: number | null;
  snapshot_id: string | null;
  summary: string | null;
  errors: string | null;
}
