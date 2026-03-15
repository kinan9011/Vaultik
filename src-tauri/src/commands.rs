use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

use crate::history::{Database, RunRecord};
use crate::password;
use crate::profile::store::ProfileStore;
use crate::profile::types::{
    BackupProfile, PasswordStorage, ProfileSummary, RetentionPolicy, Schedule,
};
use crate::restic::cli::ResticCommand;
use crate::restic::process::ProcessManager;
use crate::restic::types::{BackupMessage, LsMessage, LsNode, RestoreMessage, Snapshot};

pub struct AppState {
    pub profiles: ProfileStore,
    pub process: ProcessManager,
    pub db: Arc<Database>,
}

impl AppState {
    pub fn new(db: Database) -> Self {
        Self {
            profiles: ProfileStore::new().expect("Failed to init profile store"),
            process: ProcessManager::new(),
            db: Arc::new(db),
        }
    }
}

// ── Profile commands ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn list_profiles(state: State<'_, AppState>) -> Result<Vec<ProfileSummary>, String> {
    let profiles = state.profiles.list()?;
    let mut summaries = Vec::new();
    for mut ps in profiles {
        // Attach last run info
        if let Ok(Some(run)) = state.db.get_last_run(&ps.id.to_string()) {
            ps.last_run_exit_code = run.exit_code;
            ps.last_run_at = run.finished_at.or(Some(run.started_at));
        }
        summaries.push(ps);
    }
    Ok(summaries)
}

#[tauri::command]
pub async fn get_profile(state: State<'_, AppState>, id: String) -> Result<BackupProfile, String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    state.profiles.get(uuid)
}

#[tauri::command]
pub async fn create_profile(
    state: State<'_, AppState>,
    profile: BackupProfile,
    repo_password: Option<String>,
) -> Result<String, String> {
    if let Some(pw) = repo_password {
        let account = profile.id.to_string();
        password::store_password("vaultik", &account, &pw)?;
    }
    state.profiles.save(&profile)?;
    Ok(profile.id.to_string())
}

#[tauri::command]
pub async fn update_profile(
    state: State<'_, AppState>,
    profile: BackupProfile,
) -> Result<(), String> {
    state.profiles.save(&profile)
}

#[tauri::command]
pub async fn delete_profile(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    password::delete_password("vaultik", &id)?;
    let _ = crate::schedule::uninstall_schedule(&id);
    state.profiles.delete(uuid)
}

// ── Repository commands ─────────────────────────────────────────────────────

#[tauri::command]
pub async fn init_repo(
    state: State<'_, AppState>,
    repo_url: String,
    repo_password: String,
) -> Result<String, String> {
    let (args, env) = ResticCommand::init(&repo_url)
        .with_password(&repo_password)
        .build();

    let (stdout, _) = state
        .process
        .run_to_completion(args, env)
        .await
        .map_err(|e| e.to_string())?;

    Ok(stdout)
}

#[tauri::command]
pub async fn test_repo(
    state: State<'_, AppState>,
    profile: BackupProfile,
) -> Result<String, String> {
    let password = resolve_profile_password(&profile)?;
    let (args, env) = ResticCommand::snapshots(&profile)
        .with_password(&password)
        .build();

    let (stdout, _) = state
        .process
        .run_to_completion(args, env)
        .await
        .map_err(|e| e.to_string())?;

    Ok(stdout)
}

// ── Backup commands ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct BackupProgressPayload {
    pub run_id: String,
    pub message: BackupMessage,
}

#[tauri::command]
pub async fn run_backup(
    state: State<'_, AppState>,
    app: AppHandle,
    profile_id: String,
) -> Result<String, String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let profile = state.profiles.get(uuid)?;
    let password = resolve_profile_password(&profile)?;

    let run_id = Uuid::new_v4().to_string();
    let db_run_id = state
        .db
        .insert_run(&profile_id, "manual", "backup")?;

    let (args, env) = ResticCommand::backup(&profile)
        .with_password(&password)
        .build();

    let (mut line_rx, mut result_rx) = state
        .process
        .spawn(run_id.clone(), args, env)
        .await
        .map_err(|e| e.to_string())?;

    let run_id_clone = run_id.clone();
    let profile_name = profile.name.clone();
    let profile_clone = profile.clone();
    let app_clone = app.clone();
    let db = state.db.clone();

    // Auto-forget + check settings
    let auto_prune = profile.auto_prune;
    let retention = profile.retention.clone();
    let check_after = profile.check_after_backup;
    let check_subset = profile.check_read_data_subset.clone();

    tokio::spawn(async move {
        let mut errors: Vec<String> = Vec::new();
        let mut summary_json: Option<String> = None;
        let mut snapshot_id: Option<String> = None;
        let mut files_new: u64 = 0;
        let mut data_added: u64 = 0;

        // Process stdout lines
        while let Some(line) = line_rx.recv().await {
            if line.trim().is_empty() {
                continue;
            }
            match serde_json::from_str::<BackupMessage>(&line) {
                Ok(msg) => {
                    match &msg {
                        BackupMessage::Error(e) => {
                            errors.push(format!("{}: {}", e.item, e.error));
                        }
                        BackupMessage::Summary(s) => {
                            summary_json = Some(line.clone());
                            snapshot_id = Some(s.snapshot_id.clone());
                            files_new = s.files_new;
                            data_added = s.data_added;
                        }
                        _ => {}
                    }

                    let payload = BackupProgressPayload {
                        run_id: run_id_clone.clone(),
                        message: msg,
                    };
                    let _ = app_clone.emit("backup-progress", &payload);
                }
                Err(_) => {
                    log::debug!("Non-JSON line from restic: {}", line);
                }
            }
        }

        // Wait for process result
        if let Some(result) = result_rx.recv().await {
            let errors_json = if errors.is_empty() {
                None
            } else {
                Some(serde_json::to_string(&errors).unwrap_or_default())
            };

            // Persist to history DB
            let _ = db.finish_run(
                db_run_id,
                result.exit_code,
                snapshot_id.as_deref(),
                summary_json.as_deref(),
                errors_json.as_deref(),
            );

            // Notifications
            if result.cancelled {
                // no notification
            } else if result.exit_code == 0 {
                crate::notify::notify_backup_success(&profile_name, files_new, data_added);
            } else if result.exit_code == 3 {
                crate::notify::notify_backup_partial(&profile_name, errors.len() as u32);
            } else {
                crate::notify::notify_backup_failed(&profile_name, &result.stderr);
            }

            // Emit completion event
            let _ = app_clone.emit(
                "backup-complete",
                serde_json::json!({
                    "run_id": run_id_clone,
                    "exit_code": result.exit_code,
                    "cancelled": result.cancelled,
                    "snapshot_id": snapshot_id,
                    "files_new": files_new,
                    "data_added": data_added,
                    "error_count": errors.len(),
                }),
            );

            // Auto-forget with retention policy after successful backup
            if !result.cancelled && result.exit_code == 0 && has_retention(&retention) {
                let password = resolve_profile_password(&profile_clone).ok();
                if let Some(pw) = password {
                    let (forget_args, forget_env) =
                        ResticCommand::forget_with_policy(&profile_clone, &retention, auto_prune)
                            .with_password(&pw)
                            .build();
                    let pm = ProcessManager::new();
                    let _ = pm.run_to_completion(forget_args, forget_env).await;
                }
            }

            // Auto-check after backup
            if !result.cancelled && result.exit_code == 0 && check_after {
                let password = resolve_profile_password(&profile_clone).ok();
                if let Some(pw) = password {
                    let (check_args, check_env) =
                        ResticCommand::check(&profile_clone, check_subset.as_deref())
                            .with_password(&pw)
                            .build();
                    let pm = ProcessManager::new();
                    let _ = pm.run_to_completion(check_args, check_env).await;
                }
            }
        }
    });

    Ok(run_id)
}

#[tauri::command]
pub async fn cancel_operation(
    state: State<'_, AppState>,
    run_id: String,
) -> Result<bool, String> {
    Ok(state.process.cancel(&run_id).await)
}

// ── Snapshot commands ───────────────────────────────────────────────────────

#[tauri::command]
pub async fn list_snapshots(
    state: State<'_, AppState>,
    profile_id: String,
) -> Result<Vec<Snapshot>, String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let profile = state.profiles.get(uuid)?;
    let password = resolve_profile_password(&profile)?;

    let (args, env) = ResticCommand::snapshots(&profile)
        .with_password(&password)
        .build();

    let (stdout, _) = state
        .process
        .run_to_completion(args, env)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::from_str::<Vec<Snapshot>>(&stdout)
        .map_err(|e| format!("Failed to parse snapshots: {e}"))
}

#[tauri::command]
pub async fn browse_snapshot(
    state: State<'_, AppState>,
    profile_id: String,
    snapshot_id: String,
    path: Option<String>,
) -> Result<Vec<LsNode>, String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let profile = state.profiles.get(uuid)?;
    let password = resolve_profile_password(&profile)?;

    let snap_arg = if let Some(ref p) = path {
        format!("{}:{}", snapshot_id, p)
    } else {
        snapshot_id
    };

    let (args, env) = ResticCommand::ls(&profile, &snap_arg)
        .with_password(&password)
        .build();

    let (stdout, _) = state
        .process
        .run_to_completion(args, env)
        .await
        .map_err(|e| e.to_string())?;

    let mut nodes = Vec::new();
    for line in stdout.lines() {
        if line.trim().is_empty() {
            continue;
        }
        match serde_json::from_str::<LsMessage>(line) {
            Ok(LsMessage::Node(node)) => nodes.push(node),
            Ok(LsMessage::Snapshot(_)) => {}
            Err(_) => {}
        }
    }

    Ok(nodes)
}

// ── Restore commands ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn run_restore(
    state: State<'_, AppState>,
    app: AppHandle,
    profile_id: String,
    snapshot_id: String,
    target: String,
    includes: Vec<String>,
    excludes: Vec<String>,
    verify: bool,
) -> Result<String, String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let profile = state.profiles.get(uuid)?;
    let password = resolve_profile_password(&profile)?;

    let run_id = Uuid::new_v4().to_string();
    let db_run_id = state
        .db
        .insert_run(&profile_id, "manual", "restore")?;
    let db = state.db.clone();

    let (args, env) = ResticCommand::restore(
        &profile,
        &snapshot_id,
        &target,
        &includes,
        &excludes,
        verify,
    )
    .with_password(&password)
    .build();

    let (mut line_rx, mut result_rx) = state
        .process
        .spawn(run_id.clone(), args, env)
        .await
        .map_err(|e| e.to_string())?;

    let run_id_clone = run_id.clone();
    let app_clone = app.clone();

    tokio::spawn(async move {
        let mut summary_json: Option<String> = None;

        while let Some(line) = line_rx.recv().await {
            if line.trim().is_empty() {
                continue;
            }
            if let Ok(msg) = serde_json::from_str::<RestoreMessage>(&line) {
                if matches!(msg, RestoreMessage::Summary(_)) {
                    summary_json = Some(line.clone());
                }
                let _ = app_clone.emit(
                    "restore-progress",
                    serde_json::json!({
                        "run_id": run_id_clone,
                        "message": msg,
                    }),
                );
            }
        }

        if let Some(result) = result_rx.recv().await {
            let _ = db.finish_run(
                db_run_id,
                result.exit_code,
                None,
                summary_json.as_deref(),
                None,
            );

            let _ = app_clone.emit(
                "restore-complete",
                serde_json::json!({
                    "run_id": run_id_clone,
                    "exit_code": result.exit_code,
                    "cancelled": result.cancelled,
                }),
            );
        }
    });

    Ok(run_id)
}

// ── Forget commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub async fn forget_snapshots(
    state: State<'_, AppState>,
    profile_id: String,
    snapshot_ids: Vec<String>,
) -> Result<String, String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let profile = state.profiles.get(uuid)?;
    let password = resolve_profile_password(&profile)?;

    let (args, env) = ResticCommand::forget(&profile, &snapshot_ids)
        .with_password(&password)
        .build();

    let (stdout, _) = state
        .process
        .run_to_completion(args, env)
        .await
        .map_err(|e| e.to_string())?;

    Ok(stdout)
}

// ── Check commands ──────────────────────────────────────────────────────────

#[tauri::command]
pub async fn run_check(
    state: State<'_, AppState>,
    profile_id: String,
    read_data_subset: Option<String>,
) -> Result<String, String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let profile = state.profiles.get(uuid)?;
    let password = resolve_profile_password(&profile)?;

    let (args, env) = ResticCommand::check(&profile, read_data_subset.as_deref())
        .with_password(&password)
        .build();

    let (stdout, _) = state
        .process
        .run_to_completion(args, env)
        .await
        .map_err(|e| e.to_string())?;

    Ok(stdout)
}

// ── Pause/Resume commands ────────────────────────────────────────────────────

#[tauri::command]
pub async fn toggle_pause(
    state: State<'_, AppState>,
    profile_id: String,
) -> Result<bool, String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let mut profile = state.profiles.get(uuid)?;
    profile.paused = !profile.paused;

    // If pausing and has a schedule, uninstall the OS timer
    if profile.paused {
        let _ = crate::schedule::uninstall_schedule(&profile_id);
    } else if let Some(ref schedule) = profile.schedule {
        // Resuming: re-install the OS timer
        let _ = crate::schedule::install_schedule(&profile_id, schedule);
    }

    state.profiles.save(&profile)?;
    Ok(profile.paused)
}

// ── History commands ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_run_history(
    state: State<'_, AppState>,
    profile_id: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<RunRecord>, String> {
    state
        .db
        .get_history(profile_id.as_deref(), limit.unwrap_or(50))
}

// ── Utility commands ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_restic_version(state: State<'_, AppState>) -> Result<String, String> {
    let (args, env) = ResticCommand::version().build();
    let (stdout, _) = state
        .process
        .run_to_completion(args, env)
        .await
        .map_err(|e| e.to_string())?;
    Ok(stdout.trim().to_string())
}

// ── Schedule commands ───────────────────────────────────────────────────────

#[tauri::command]
pub async fn set_schedule(
    state: State<'_, AppState>,
    profile_id: String,
    schedule: Schedule,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let mut profile = state.profiles.get(uuid)?;

    crate::schedule::install_schedule(&profile_id, &schedule)?;

    profile.schedule = Some(schedule);
    state.profiles.save(&profile)?;
    Ok(())
}

#[tauri::command]
pub async fn remove_schedule(
    state: State<'_, AppState>,
    profile_id: String,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&profile_id).map_err(|e| format!("Invalid profile ID: {e}"))?;
    let mut profile = state.profiles.get(uuid)?;

    crate::schedule::uninstall_schedule(&profile_id)?;

    profile.schedule = None;
    state.profiles.save(&profile)?;
    Ok(())
}

// ── Export / Import commands ─────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ExportEnvelope {
    version: u32,
    exported_at: String,
    profiles: Vec<BackupProfile>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImportResult {
    pub imported: usize,
    pub skipped: usize,
    pub names: Vec<String>,
}

#[tauri::command]
pub async fn export_profiles(
    state: State<'_, AppState>,
    profile_ids: Vec<String>,
    path: String,
) -> Result<usize, String> {
    let mut profiles = Vec::new();

    if profile_ids.is_empty() {
        // Export all
        let summaries = state.profiles.list()?;
        for ps in &summaries {
            let p = state.profiles.get(ps.id)?;
            profiles.push(p);
        }
    } else {
        for id_str in &profile_ids {
            let uuid =
                Uuid::parse_str(id_str).map_err(|e| format!("Invalid profile ID: {e}"))?;
            let p = state.profiles.get(uuid)?;
            profiles.push(p);
        }
    }

    // Strip passwords — replace with a placeholder keyring entry
    let sanitized: Vec<BackupProfile> = profiles
        .into_iter()
        .map(|mut p| {
            p.password_storage = PasswordStorage::Keyring {
                service: "vaultik".to_string(),
                account: String::new(),
            };
            p
        })
        .collect();

    let count = sanitized.len();
    let envelope = ExportEnvelope {
        version: 1,
        exported_at: chrono::Utc::now().to_rfc3339(),
        profiles: sanitized,
    };

    let json = serde_json::to_string_pretty(&envelope)
        .map_err(|e| format!("Failed to serialize: {e}"))?;

    std::fs::write(&path, json).map_err(|e| format!("Failed to write file: {e}"))?;

    Ok(count)
}

#[tauri::command]
pub async fn import_profiles(
    state: State<'_, AppState>,
    path: String,
) -> Result<ImportResult, String> {
    let content =
        std::fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {e}"))?;

    let envelope: ExportEnvelope =
        serde_json::from_str(&content).map_err(|e| format!("Invalid export file: {e}"))?;

    // Collect existing profile names for duplicate detection
    let existing: Vec<String> = state
        .profiles
        .list()?
        .iter()
        .map(|s| s.name.clone())
        .collect();

    let mut imported = 0;
    let mut skipped = 0;
    let mut names = Vec::new();

    for mut profile in envelope.profiles {
        if existing.contains(&profile.name) {
            skipped += 1;
            continue;
        }

        // Assign new UUID to avoid collisions
        let new_id = Uuid::new_v4();
        profile.id = new_id;

        // Set password storage to keyring with the new ID
        profile.password_storage = PasswordStorage::Keyring {
            service: "vaultik".to_string(),
            account: new_id.to_string(),
        };

        // Clear schedule — must be set up per-machine
        profile.schedule = None;
        profile.paused = false;

        names.push(profile.name.clone());
        state.profiles.save(&profile)?;
        imported += 1;
    }

    Ok(ImportResult {
        imported,
        skipped,
        names,
    })
}

// ── Helpers ─────────────────────────────────────────────────────────────────

fn resolve_profile_password(profile: &BackupProfile) -> Result<String, String> {
    password::resolve_password(&profile.password_storage)
}

fn has_retention(r: &RetentionPolicy) -> bool {
    r.keep_last.is_some()
        || r.keep_hourly.is_some()
        || r.keep_daily.is_some()
        || r.keep_weekly.is_some()
        || r.keep_monthly.is_some()
        || r.keep_yearly.is_some()
        || r.keep_within.is_some()
}
