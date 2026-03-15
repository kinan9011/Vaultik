#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod history;
mod notify;
mod password;
mod profile;
mod restic;
mod schedule;

use log::info;

fn main() {
    env_logger::init();
    info!("Starting Vaultik");

    let db = history::Database::open().expect("Failed to open history database");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .manage(commands::AppState::new(db))
        .invoke_handler(tauri::generate_handler![
            commands::list_profiles,
            commands::get_profile,
            commands::create_profile,
            commands::update_profile,
            commands::delete_profile,
            commands::init_repo,
            commands::test_repo,
            commands::run_backup,
            commands::cancel_operation,
            commands::list_snapshots,
            commands::browse_snapshot,
            commands::run_restore,
            commands::forget_snapshots,
            commands::run_check,
            commands::toggle_pause,
            commands::get_run_history,
            commands::get_restic_version,
            commands::set_schedule,
            commands::remove_schedule,
            commands::export_profiles,
            commands::import_profiles,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
