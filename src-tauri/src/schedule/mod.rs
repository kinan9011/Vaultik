use crate::profile::types::Schedule;

/// Install or update a schedule for a profile.
pub fn install_schedule(profile_id: &str, schedule: &Schedule) -> Result<(), String> {
    platform::install(profile_id, schedule)
}

/// Remove a schedule for a profile.
pub fn uninstall_schedule(profile_id: &str) -> Result<(), String> {
    platform::uninstall(profile_id)
}

#[cfg(target_os = "linux")]
mod platform {
    use crate::profile::types::{Schedule, ScheduleKind};
    use std::fs;
    use std::process::Command;

    fn unit_name(profile_id: &str) -> String {
        format!("vaultik-{profile_id}")
    }

    fn systemd_user_dir() -> std::path::PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| std::path::PathBuf::from(".config"))
            .join("systemd/user")
    }

    pub fn install(profile_id: &str, schedule: &Schedule) -> Result<(), String> {
        let dir = systemd_user_dir();
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create systemd dir: {e}"))?;

        let name = unit_name(profile_id);

        let exe = std::env::current_exe()
            .map_err(|e| format!("Failed to get executable path: {e}"))?;
        let exe_str = exe.to_string_lossy();

        let service = format!(
            "[Unit]\n\
             Description=Vaultik Backup - {profile_id}\n\
             \n\
             [Service]\n\
             Type=oneshot\n\
             ExecStart={exe_str} run {profile_id} --notify\n\
             Environment=DISPLAY=:0\n"
        );
        fs::write(dir.join(format!("{name}.service")), service)
            .map_err(|e| format!("Failed to write service unit: {e}"))?;

        let on_calendar = match schedule.kind {
            ScheduleKind::Hourly => "*-*-* *:00:00".to_string(),
            ScheduleKind::Daily => {
                let time = schedule.time.as_deref().unwrap_or("02:00");
                format!("*-*-* {time}:00")
            }
            ScheduleKind::Weekly => {
                let day = schedule.day_of_week.as_deref().unwrap_or("Mon");
                let time = schedule.time.as_deref().unwrap_or("02:00");
                format!("{day} *-*-* {time}:00")
            }
            ScheduleKind::Custom => schedule
                .cron_expr
                .clone()
                .unwrap_or_else(|| "*-*-* 02:00:00".to_string()),
        };

        let timer = format!(
            "[Unit]\n\
             Description=Vaultik Backup Timer - {profile_id}\n\
             \n\
             [Timer]\n\
             OnCalendar={on_calendar}\n\
             Persistent=true\n\
             \n\
             [Install]\n\
             WantedBy=timers.target\n"
        );
        fs::write(dir.join(format!("{name}.timer")), timer)
            .map_err(|e| format!("Failed to write timer unit: {e}"))?;

        Command::new("systemctl")
            .args(["--user", "daemon-reload"])
            .output()
            .map_err(|e| format!("systemctl daemon-reload failed: {e}"))?;

        Command::new("systemctl")
            .args(["--user", "enable", "--now", &format!("{name}.timer")])
            .output()
            .map_err(|e| format!("systemctl enable failed: {e}"))?;

        Ok(())
    }

    pub fn uninstall(profile_id: &str) -> Result<(), String> {
        let dir = systemd_user_dir();
        let name = unit_name(profile_id);

        let _ = Command::new("systemctl")
            .args(["--user", "disable", "--now", &format!("{name}.timer")])
            .output();

        let _ = fs::remove_file(dir.join(format!("{name}.timer")));
        let _ = fs::remove_file(dir.join(format!("{name}.service")));

        let _ = Command::new("systemctl")
            .args(["--user", "daemon-reload"])
            .output();

        Ok(())
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use crate::profile::types::Schedule;

    pub fn install(_profile_id: &str, _schedule: &Schedule) -> Result<(), String> {
        Err("macOS scheduling not yet implemented".to_string())
    }

    pub fn uninstall(_profile_id: &str) -> Result<(), String> {
        Err("macOS scheduling not yet implemented".to_string())
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use crate::profile::types::Schedule;

    pub fn install(_profile_id: &str, _schedule: &Schedule) -> Result<(), String> {
        Err("Windows scheduling not yet implemented".to_string())
    }

    pub fn uninstall(_profile_id: &str) -> Result<(), String> {
        Err("Windows scheduling not yet implemented".to_string())
    }
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
mod platform {
    use crate::profile::types::Schedule;

    pub fn install(_profile_id: &str, _schedule: &Schedule) -> Result<(), String> {
        Err("Scheduling not supported on this platform".to_string())
    }

    pub fn uninstall(_profile_id: &str) -> Result<(), String> {
        Err("Scheduling not supported on this platform".to_string())
    }
}
