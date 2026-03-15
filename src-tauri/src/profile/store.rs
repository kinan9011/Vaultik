use std::fs;
use std::path::PathBuf;

use log::{debug, info};
use uuid::Uuid;

use super::types::{BackupProfile, ProfileSummary};

/// Manages backup profiles stored as JSON files on disk.
pub struct ProfileStore {
    dir: PathBuf,
}

impl ProfileStore {
    pub fn new() -> Result<Self, String> {
        let dir = config_dir().join("profiles");
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create profiles dir: {e}"))?;
        Ok(Self { dir })
    }

    pub fn list(&self) -> Result<Vec<ProfileSummary>, String> {
        let mut profiles = Vec::new();
        let entries = fs::read_dir(&self.dir)
            .map_err(|e| format!("Failed to read profiles dir: {e}"))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|ext| ext == "json") {
                match fs::read_to_string(&path) {
                    Ok(content) => match serde_json::from_str::<BackupProfile>(&content) {
                        Ok(profile) => profiles.push(ProfileSummary::from(&profile)),
                        Err(e) => {
                            log::warn!("Skipping invalid profile {:?}: {}", path, e);
                        }
                    },
                    Err(e) => {
                        log::warn!("Failed to read profile {:?}: {}", path, e);
                    }
                }
            }
        }

        profiles.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(profiles)
    }

    pub fn get(&self, id: Uuid) -> Result<BackupProfile, String> {
        let path = self.profile_path(id);
        let content =
            fs::read_to_string(&path).map_err(|_| format!("Profile {id} not found"))?;
        serde_json::from_str(&content).map_err(|e| format!("Invalid profile data: {e}"))
    }

    pub fn save(&self, profile: &BackupProfile) -> Result<(), String> {
        let path = self.profile_path(profile.id);
        let content = serde_json::to_string_pretty(profile)
            .map_err(|e| format!("Failed to serialize profile: {e}"))?;
        fs::write(&path, content).map_err(|e| format!("Failed to write profile: {e}"))?;
        info!("Saved profile {} to {:?}", profile.name, path);
        Ok(())
    }

    pub fn delete(&self, id: Uuid) -> Result<(), String> {
        let path = self.profile_path(id);
        if path.exists() {
            fs::remove_file(&path).map_err(|e| format!("Failed to delete profile: {e}"))?;
            debug!("Deleted profile {}", id);
        }
        Ok(())
    }

    fn profile_path(&self, id: Uuid) -> PathBuf {
        self.dir.join(format!("{id}.json"))
    }
}

/// Returns the configuration directory for the application.
pub fn config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("vaultik")
}
