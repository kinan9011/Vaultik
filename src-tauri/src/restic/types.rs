use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ── Backup JSON output types ────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "message_type")]
pub enum BackupMessage {
    #[serde(rename = "status")]
    Status(BackupStatus),
    #[serde(rename = "verbose_status")]
    VerboseStatus(BackupVerboseStatus),
    #[serde(rename = "error")]
    Error(BackupError),
    #[serde(rename = "summary")]
    Summary(BackupSummary),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupStatus {
    #[serde(default)]
    pub seconds_elapsed: u64,
    #[serde(default)]
    pub seconds_remaining: u64,
    #[serde(default)]
    pub percent_done: f64,
    #[serde(default)]
    pub total_files: u64,
    #[serde(default)]
    pub files_done: u64,
    #[serde(default)]
    pub total_bytes: u64,
    #[serde(default)]
    pub bytes_done: u64,
    #[serde(default)]
    pub error_count: u32,
    #[serde(default)]
    pub current_files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupVerboseStatus {
    pub action: String,
    #[serde(default)]
    pub item: String,
    #[serde(default)]
    pub duration: f64,
    #[serde(default)]
    pub data_size: u64,
    #[serde(default)]
    pub data_size_in_repo: u64,
    #[serde(default)]
    pub metadata_size: u64,
    #[serde(default)]
    pub metadata_size_in_repo: u64,
    #[serde(default)]
    pub total_files: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupError {
    pub error: serde_json::Value,
    #[serde(default)]
    pub during: String,
    #[serde(default)]
    pub item: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupSummary {
    #[serde(default)]
    pub files_new: u64,
    #[serde(default)]
    pub files_changed: u64,
    #[serde(default)]
    pub files_unmodified: u64,
    #[serde(default)]
    pub dirs_new: u64,
    #[serde(default)]
    pub dirs_changed: u64,
    #[serde(default)]
    pub dirs_unmodified: u64,
    #[serde(default)]
    pub data_blobs: u64,
    #[serde(default)]
    pub tree_blobs: u64,
    #[serde(default)]
    pub data_added: u64,
    #[serde(default)]
    pub data_added_packed: u64,
    #[serde(default)]
    pub total_files_processed: u64,
    #[serde(default)]
    pub total_bytes_processed: u64,
    #[serde(default)]
    pub total_duration: f64,
    pub backup_start: Option<DateTime<Utc>>,
    pub backup_end: Option<DateTime<Utc>>,
    #[serde(default)]
    pub snapshot_id: String,
    #[serde(default)]
    pub dry_run: bool,
}

// ── Restore JSON output types ───────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "message_type")]
pub enum RestoreMessage {
    #[serde(rename = "status")]
    Status(RestoreStatus),
    #[serde(rename = "verbose_status")]
    VerboseStatus(RestoreVerboseStatus),
    #[serde(rename = "summary")]
    Summary(RestoreSummary),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreStatus {
    #[serde(default)]
    pub seconds_elapsed: u64,
    #[serde(default)]
    pub percent_done: f64,
    #[serde(default)]
    pub total_files: u64,
    #[serde(default)]
    pub files_restored: u64,
    #[serde(default)]
    pub files_skipped: u64,
    #[serde(default)]
    pub files_deleted: u64,
    #[serde(default)]
    pub total_bytes: u64,
    #[serde(default)]
    pub bytes_restored: u64,
    #[serde(default)]
    pub bytes_skipped: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreVerboseStatus {
    pub action: String,
    #[serde(default)]
    pub item: String,
    #[serde(default)]
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreSummary {
    #[serde(default)]
    pub seconds_elapsed: u64,
    #[serde(default)]
    pub total_files: u64,
    #[serde(default)]
    pub files_restored: u64,
    #[serde(default)]
    pub files_skipped: u64,
    #[serde(default)]
    pub files_deleted: u64,
    #[serde(default)]
    pub total_bytes: u64,
    #[serde(default)]
    pub bytes_restored: u64,
    #[serde(default)]
    pub bytes_skipped: u64,
}

// ── Snapshot types ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub time: DateTime<Utc>,
    #[serde(default)]
    pub parent: Option<String>,
    pub tree: Option<String>,
    #[serde(default)]
    pub paths: Vec<String>,
    #[serde(default)]
    pub hostname: String,
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub uid: u32,
    #[serde(default)]
    pub gid: u32,
    #[serde(default)]
    pub excludes: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub original: Option<String>,
    #[serde(default)]
    pub program_version: String,
    pub summary: Option<SnapshotSummary>,
    // These are added by the `restic snapshots` command
    pub id: Option<String>,
    pub short_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotSummary {
    pub backup_start: Option<DateTime<Utc>>,
    pub backup_end: Option<DateTime<Utc>>,
    #[serde(default)]
    pub files_new: u64,
    #[serde(default)]
    pub files_changed: u64,
    #[serde(default)]
    pub files_unmodified: u64,
    #[serde(default)]
    pub dirs_new: u64,
    #[serde(default)]
    pub dirs_changed: u64,
    #[serde(default)]
    pub dirs_unmodified: u64,
    #[serde(default)]
    pub data_blobs: u64,
    #[serde(default)]
    pub tree_blobs: u64,
    #[serde(default)]
    pub data_added: u64,
    #[serde(default)]
    pub data_added_packed: u64,
    #[serde(default)]
    pub total_files_processed: u64,
    #[serde(default)]
    pub total_bytes_processed: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotGroup {
    pub group_key: serde_json::Value,
    pub snapshots: Vec<Snapshot>,
}

// ── Ls types ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "message_type")]
pub enum LsMessage {
    #[serde(rename = "snapshot")]
    Snapshot(LsSnapshot),
    #[serde(rename = "node")]
    Node(LsNode),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LsSnapshot {
    pub id: Option<String>,
    pub short_id: Option<String>,
    pub time: Option<DateTime<Utc>>,
    #[serde(default)]
    pub paths: Vec<String>,
    #[serde(default)]
    pub hostname: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LsNode {
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String,
    #[serde(default)]
    pub path: String,
    #[serde(default)]
    pub uid: u32,
    #[serde(default)]
    pub gid: u32,
    pub size: Option<u64>,
    pub mode: Option<u32>,
    #[serde(default)]
    pub permissions: String,
    pub mtime: Option<DateTime<Utc>>,
    pub atime: Option<DateTime<Utc>>,
    pub ctime: Option<DateTime<Utc>>,
    #[serde(default)]
    pub inode: u64,
}

// ── Stats types ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoStats {
    #[serde(default)]
    pub total_size: u64,
    #[serde(default)]
    pub total_uncompressed_size: u64,
    #[serde(default)]
    pub compression_ratio: f64,
    #[serde(default)]
    pub compression_progress: f64,
    #[serde(default)]
    pub compression_space_saving: f64,
    #[serde(default)]
    pub total_file_count: u64,
    #[serde(default)]
    pub total_blob_count: u64,
    #[serde(default)]
    pub snapshots_count: u64,
}

// ── Forget types ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForgetGroup {
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub host: String,
    #[serde(default)]
    pub paths: Vec<String>,
    #[serde(default)]
    pub keep: Vec<Snapshot>,
    #[serde(default)]
    pub remove: Vec<Snapshot>,
    #[serde(default)]
    pub reasons: Vec<serde_json::Value>,
}

// ── Init types ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitSuccess {
    pub message_type: String,
    pub id: String,
    pub repository: String,
}

// ── Check types ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckSummary {
    pub message_type: Option<String>,
    #[serde(default)]
    pub num_errors: u64,
    #[serde(default)]
    pub broken_packs: Vec<String>,
    #[serde(default)]
    pub hint_repair_index: bool,
    #[serde(default)]
    pub hint_prune: bool,
}
