use crate::profile::types::{BackupProfile, PasswordStorage, RetentionPolicy};

/// Builds restic CLI argument lists from typed Rust structs.
pub struct ResticCommand {
    args: Vec<String>,
    env: Vec<(String, String)>,
}

impl ResticCommand {
    fn new(subcommand: &str) -> Self {
        Self {
            args: vec![subcommand.to_string()],
            env: Vec::new(),
        }
    }

    /// Apply common repo + password args from a profile.
    fn with_profile(mut self, profile: &BackupProfile) -> Self {
        self.args.push("--repo".to_string());
        self.args.push(profile.repo_url.clone());
        self.args.push("--json".to_string());

        match &profile.password_storage {
            PasswordStorage::File { path } => {
                self.args.push("--password-file".to_string());
                self.args.push(path.to_string_lossy().to_string());
            }
            PasswordStorage::Command { command } => {
                self.args.push("--password-command".to_string());
                self.args.push(command.clone());
            }
            PasswordStorage::Keyring { .. } => {
                // Password will be provided via RESTIC_PASSWORD env var
                // The caller must resolve the keyring and set env.
            }
        }

        if let Some(ref compression) = profile.compression {
            self.args.push("--compression".to_string());
            self.args.push(compression.clone());
        }

        if let Some(limit) = profile.upload_limit_kib {
            self.args.push("--limit-upload".to_string());
            self.args.push(limit.to_string());
        }

        if let Some(limit) = profile.download_limit_kib {
            self.args.push("--limit-download".to_string());
            self.args.push(limit.to_string());
        }

        for (key, value) in &profile.backend_options {
            self.args.push("-o".to_string());
            self.args.push(format!("{key}={value}"));
        }

        self
    }

    fn arg(mut self, flag: &str) -> Self {
        self.args.push(flag.to_string());
        self
    }

    fn arg_val(mut self, flag: &str, value: &str) -> Self {
        self.args.push(flag.to_string());
        self.args.push(value.to_string());
        self
    }

    fn env_var(mut self, key: &str, value: &str) -> Self {
        self.env.push((key.to_string(), value.to_string()));
        self
    }

    pub fn build(self) -> (Vec<String>, Vec<(String, String)>) {
        (self.args, self.env)
    }

    // ── Command constructors ────────────────────────────────────────

    pub fn backup(profile: &BackupProfile) -> Self {
        let mut cmd = Self::new("backup")
            .with_profile(profile)
            .arg("--verbose");

        for exclude in &profile.excludes {
            cmd = cmd.arg_val("--exclude", exclude);
        }

        if profile.exclude_caches {
            cmd = cmd.arg("--exclude-caches");
        }

        for pattern in &profile.exclude_if_present {
            cmd = cmd.arg_val("--exclude-if-present", pattern);
        }

        if let Some(ref max_size) = profile.exclude_larger_than {
            cmd = cmd.arg_val("--exclude-larger-than", max_size);
        }

        if profile.one_file_system {
            cmd = cmd.arg("--one-file-system");
        }

        for tag in &profile.tags {
            cmd = cmd.arg_val("--tag", tag);
        }

        if let Some(ref host) = profile.host_override {
            cmd = cmd.arg_val("--host", host);
        }

        if let Some(concurrency) = profile.read_concurrency {
            cmd = cmd.arg_val("--read-concurrency", &concurrency.to_string());
        }

        for source in &profile.sources {
            cmd.args.push(source.to_string_lossy().to_string());
        }

        cmd
    }

    pub fn snapshots(profile: &BackupProfile) -> Self {
        Self::new("snapshots").with_profile(profile)
    }

    pub fn ls(profile: &BackupProfile, snapshot_id: &str) -> Self {
        Self::new("ls")
            .with_profile(profile)
            .arg(snapshot_id)
    }

    pub fn restore(
        profile: &BackupProfile,
        snapshot_id: &str,
        target: &str,
        includes: &[String],
        excludes: &[String],
        verify: bool,
    ) -> Self {
        let mut cmd = Self::new("restore")
            .with_profile(profile)
            .arg(snapshot_id)
            .arg_val("--target", target);

        for inc in includes {
            cmd = cmd.arg_val("--include", inc);
        }
        for exc in excludes {
            cmd = cmd.arg_val("--exclude", exc);
        }
        if verify {
            cmd = cmd.arg("--verify");
        }

        cmd
    }

    pub fn forget(profile: &BackupProfile, snapshot_ids: &[String]) -> Self {
        let mut cmd = Self::new("forget").with_profile(profile);

        for id in snapshot_ids {
            cmd.args.push(id.clone());
        }

        cmd
    }

    pub fn forget_with_policy(profile: &BackupProfile, policy: &RetentionPolicy, prune: bool) -> Self {
        let mut cmd = Self::new("forget").with_profile(profile);

        if let Some(n) = policy.keep_last {
            cmd = cmd.arg_val("--keep-last", &n.to_string());
        }
        if let Some(n) = policy.keep_hourly {
            cmd = cmd.arg_val("--keep-hourly", &n.to_string());
        }
        if let Some(n) = policy.keep_daily {
            cmd = cmd.arg_val("--keep-daily", &n.to_string());
        }
        if let Some(n) = policy.keep_weekly {
            cmd = cmd.arg_val("--keep-weekly", &n.to_string());
        }
        if let Some(n) = policy.keep_monthly {
            cmd = cmd.arg_val("--keep-monthly", &n.to_string());
        }
        if let Some(n) = policy.keep_yearly {
            cmd = cmd.arg_val("--keep-yearly", &n.to_string());
        }
        if let Some(ref within) = policy.keep_within {
            cmd = cmd.arg_val("--keep-within", within);
        }
        for tag in &policy.keep_tags {
            cmd = cmd.arg_val("--keep-tag", tag);
        }
        if prune {
            cmd = cmd.arg("--prune");
        }

        cmd
    }

    pub fn check(profile: &BackupProfile, read_data_subset: Option<&str>) -> Self {
        let mut cmd = Self::new("check").with_profile(profile);

        if let Some(subset) = read_data_subset {
            cmd = cmd.arg_val("--read-data-subset", subset);
        }

        cmd
    }

    pub fn init(repo_url: &str) -> Self {
        Self::new("init")
            .arg("--repo")
            .arg(repo_url)
            .arg("--json")
    }

    pub fn stats(profile: &BackupProfile) -> Self {
        Self::new("stats").with_profile(profile)
    }

    pub fn version() -> Self {
        Self::new("version")
    }

    /// Set the password directly as an environment variable.
    pub fn with_password(self, password: &str) -> Self {
        self.env_var("RESTIC_PASSWORD", password)
    }
}
