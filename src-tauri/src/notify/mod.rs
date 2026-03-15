use log::warn;

/// Send a desktop notification about a backup result.
pub fn send_notification(title: &str, body: &str) {
    if let Err(e) = notify_rust::Notification::new()
        .appname("Vaultik")
        .summary(title)
        .body(body)
        .timeout(notify_rust::Timeout::Milliseconds(10000))
        .show()
    {
        warn!("Failed to send notification: {}", e);
    }
}

pub fn notify_backup_success(profile_name: &str, files_new: u64, data_added: u64) {
    let size = format_bytes(data_added);
    send_notification(
        &format!("Backup '{}' completed", profile_name),
        &format!("{} new files, {} added", files_new, size),
    );
}

pub fn notify_backup_partial(profile_name: &str, error_count: u32) {
    send_notification(
        &format!("Backup '{}' completed with warnings", profile_name),
        &format!("{} errors occurred during backup", error_count),
    );
}

pub fn notify_backup_failed(profile_name: &str, reason: &str) {
    send_notification(
        &format!("Backup '{}' failed", profile_name),
        reason,
    );
}

fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = 1024 * KB;
    const GB: u64 = 1024 * MB;
    const TB: u64 = 1024 * GB;

    if bytes >= TB {
        format!("{:.1} TiB", bytes as f64 / TB as f64)
    } else if bytes >= GB {
        format!("{:.1} GiB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MiB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KiB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}
