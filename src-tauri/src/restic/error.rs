use serde::Serialize;
use thiserror::Error;

/// Maps restic exit codes to semantic errors.
#[derive(Debug, Error, Serialize, Clone)]
pub enum ResticError {
    #[error("Restic command failed: {message}")]
    Failed { exit_code: i32, message: String },

    #[error("Backup completed with warnings: {message}")]
    PartialSuccess { message: String },

    #[error("Repository not found: {repo}")]
    RepoNotFound { repo: String },

    #[error("Repository is locked by another process")]
    RepoLocked,

    #[error("Incorrect password")]
    WrongPassword,

    #[error("Restic binary not found: {0}")]
    BinaryNotFound(String),

    #[error("Failed to parse restic output: {0}")]
    ParseError(String),

    #[error("Operation was cancelled")]
    Cancelled,

    #[error("I/O error: {0}")]
    IoError(String),
}

impl ResticError {
    /// Create an error from a restic exit code and stderr output.
    pub fn from_exit_code(code: i32, stderr: &str, repo: &str) -> Self {
        match code {
            0 => unreachable!("exit code 0 is not an error"),
            3 => ResticError::PartialSuccess {
                message: stderr.to_string(),
            },
            10 => ResticError::RepoNotFound {
                repo: repo.to_string(),
            },
            11 => ResticError::RepoLocked,
            12 => ResticError::WrongPassword,
            _ => ResticError::Failed {
                exit_code: code,
                message: if stderr.is_empty() {
                    format!("restic exited with code {code}")
                } else {
                    stderr.to_string()
                },
            },
        }
    }
}

impl From<std::io::Error> for ResticError {
    fn from(e: std::io::Error) -> Self {
        ResticError::IoError(e.to_string())
    }
}
