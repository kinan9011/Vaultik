use crate::profile::types::PasswordStorage;

/// Resolve the password for a profile, returning it as a string.
pub fn resolve_password(storage: &PasswordStorage) -> Result<String, String> {
    match storage {
        PasswordStorage::Keyring { service, account } => {
            let entry = keyring::Entry::new(service, account)
                .map_err(|e| format!("Failed to access keyring: {e}"))?;
            entry
                .get_password()
                .map_err(|e| format!("Failed to retrieve password from keyring: {e}"))
        }
        PasswordStorage::File { path } => std::fs::read_to_string(path)
            .map(|s| s.trim().to_string())
            .map_err(|e| format!("Failed to read password file: {e}")),
        PasswordStorage::Command { command } => {
            let output = std::process::Command::new("sh")
                .arg("-c")
                .arg(command)
                .output()
                .map_err(|e| format!("Failed to run password command: {e}"))?;
            if !output.status.success() {
                return Err(format!(
                    "Password command failed: {}",
                    String::from_utf8_lossy(&output.stderr)
                ));
            }
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        }
    }
}

/// Store a password in the OS keyring.
pub fn store_password(service: &str, account: &str, password: &str) -> Result<(), String> {
    let entry = keyring::Entry::new(service, account)
        .map_err(|e| format!("Failed to access keyring: {e}"))?;
    entry
        .set_password(password)
        .map_err(|e| format!("Failed to store password in keyring: {e}"))
}

/// Delete a password from the OS keyring.
pub fn delete_password(service: &str, account: &str) -> Result<(), String> {
    let entry = keyring::Entry::new(service, account)
        .map_err(|e| format!("Failed to access keyring: {e}"))?;
    // Ignore errors if the password doesn't exist
    let _ = entry.delete_credential();
    Ok(())
}
