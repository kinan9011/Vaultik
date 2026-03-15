use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupProfile {
    pub id: Uuid,
    pub name: String,

    // Repository
    pub repo_url: String,
    pub password_storage: PasswordStorage,
    #[serde(default)]
    pub backend_options: Vec<(String, String)>,

    // Sources
    pub sources: Vec<PathBuf>,
    #[serde(default)]
    pub excludes: Vec<String>,
    #[serde(default)]
    pub exclude_caches: bool,
    #[serde(default)]
    pub exclude_if_present: Vec<String>,
    pub exclude_larger_than: Option<String>,
    #[serde(default)]
    pub one_file_system: bool,

    // Snapshot metadata
    #[serde(default)]
    pub tags: Vec<String>,
    pub host_override: Option<String>,

    // Retention
    #[serde(default)]
    pub retention: RetentionPolicy,
    #[serde(default)]
    pub auto_prune: bool,

    // Schedule
    pub schedule: Option<Schedule>,

    // Health
    #[serde(default)]
    pub check_after_backup: bool,
    pub check_read_data_subset: Option<String>,

    // State
    #[serde(default)]
    pub paused: bool,

    // Performance
    pub compression: Option<String>,
    pub upload_limit_kib: Option<u32>,
    pub download_limit_kib: Option<u32>,
    pub read_concurrency: Option<u32>,

    // Remote execution
    #[serde(default)]
    pub remote_host: Option<RemoteHost>,
}

impl BackupProfile {
    pub fn new(name: String, repo_url: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            repo_url,
            password_storage: PasswordStorage::Keyring {
                service: "vaultik".to_string(),
                account: String::new(),
            },
            backend_options: Vec::new(),
            sources: Vec::new(),
            excludes: Vec::new(),
            exclude_caches: false,
            exclude_if_present: Vec::new(),
            exclude_larger_than: None,
            one_file_system: false,
            tags: Vec::new(),
            host_override: None,
            retention: RetentionPolicy::default(),
            auto_prune: false,
            schedule: None,
            check_after_backup: false,
            check_read_data_subset: None,
            paused: false,
            compression: None,
            upload_limit_kib: None,
            download_limit_kib: None,
            read_concurrency: None,
            remote_host: None,
        }
    }
}

/// Configuration for executing restic on a remote host via SSH.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteHost {
    /// SSH host in user@hostname format, or just hostname.
    pub host: String,
    /// SSH port (None means default 22).
    pub port: Option<u16>,
    /// Path to SSH private key (None means use ssh-agent/default keys).
    pub identity_file: Option<String>,
    /// Path to restic binary on the remote host (None means "restic" on PATH).
    pub remote_restic_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum PasswordStorage {
    Keyring { service: String, account: String },
    File { path: PathBuf },
    Command { command: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RetentionPolicy {
    pub keep_last: Option<i32>,
    pub keep_hourly: Option<i32>,
    pub keep_daily: Option<i32>,
    pub keep_weekly: Option<i32>,
    pub keep_monthly: Option<i32>,
    pub keep_yearly: Option<i32>,
    pub keep_within: Option<String>,
    #[serde(default)]
    pub keep_tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Schedule {
    pub kind: ScheduleKind,
    pub time: Option<String>,
    pub day_of_week: Option<String>,
    pub cron_expr: Option<String>,
    #[serde(default)]
    pub retry_on_failure: bool,
    #[serde(default)]
    pub notify_on_success: bool,
    #[serde(default = "default_true")]
    pub notify_on_failure: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ScheduleKind {
    Hourly,
    Daily,
    Weekly,
    Custom,
}

/// Summary view of a profile for list display.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSummary {
    pub id: Uuid,
    pub name: String,
    pub repo_url: String,
    pub source_count: usize,
    pub has_schedule: bool,
    pub paused: bool,
    #[serde(default)]
    pub is_remote: bool,
    pub last_run_at: Option<String>,
    pub last_run_exit_code: Option<i32>,
}

impl From<&BackupProfile> for ProfileSummary {
    fn from(p: &BackupProfile) -> Self {
        Self {
            id: p.id,
            name: p.name.clone(),
            repo_url: p.repo_url.clone(),
            source_count: p.sources.len(),
            has_schedule: p.schedule.is_some(),
            paused: p.paused,
            is_remote: p.remote_host.is_some(),
            last_run_at: None,
            last_run_exit_code: None,
        }
    }
}
