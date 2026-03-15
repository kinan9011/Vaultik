use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::{mpsc, oneshot, Mutex};

use super::error::ResticError;

// ── ProcessResult ────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct ProcessResult {
    pub exit_code: i32,
    pub stderr: String,
    pub cancelled: bool,
}

// ── CancelRegistry ──────────────────────────────────────────────────────────

/// Shared registry for cancelling running operations by run_id.
#[derive(Clone)]
pub struct CancelRegistry {
    senders: Arc<Mutex<HashMap<String, oneshot::Sender<()>>>>,
}

impl CancelRegistry {
    pub fn new() -> Self {
        Self {
            senders: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Register a cancel sender for a run.
    pub async fn register(&self, run_id: String, tx: oneshot::Sender<()>) {
        self.senders.lock().await.insert(run_id, tx);
    }

    /// Cancel a running operation. Returns true if found and signalled.
    pub async fn cancel(&self, run_id: &str) -> bool {
        if let Some(tx) = self.senders.lock().await.remove(run_id) {
            let _ = tx.send(());
            true
        } else {
            false
        }
    }

    /// Remove a completed run from the registry.
    pub async fn remove(&self, run_id: &str) {
        self.senders.lock().await.remove(run_id);
    }
}

// ── ResticExecutor trait ────────────────────────────────────────────────────

/// Abstraction over how restic commands are executed (local or remote).
#[async_trait::async_trait]
pub trait ResticExecutor: Send + Sync {
    /// Spawn a restic command that streams stdout lines back.
    async fn spawn(
        &self,
        run_id: String,
        args: Vec<String>,
        env: Vec<(String, String)>,
    ) -> Result<(mpsc::Receiver<String>, mpsc::Receiver<ProcessResult>), ResticError>;

    /// Run a restic command to completion, returning (stdout, exit_code).
    async fn run_to_completion(
        &self,
        args: Vec<String>,
        env: Vec<(String, String)>,
    ) -> Result<(String, i32), ResticError>;
}
