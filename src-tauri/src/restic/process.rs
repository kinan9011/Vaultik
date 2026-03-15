use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;

use log::{debug, error, warn};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::{Mutex, oneshot};

use super::error::ResticError;

/// A handle to a running restic process.
pub struct RunningProcess {
    child: Child,
    cancel_tx: Option<oneshot::Sender<()>>,
}

/// Manages spawning and tracking restic processes.
pub struct ProcessManager {
    restic_binary: String,
    running: Arc<Mutex<HashMap<String, RunningProcess>>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            restic_binary: Self::find_restic_binary(),
            running: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn find_restic_binary() -> String {
        // Check common locations; prefer PATH
        if let Ok(path) = which::which("restic") {
            return path.to_string_lossy().to_string();
        }
        // Fallback: assume it's on PATH and let spawn fail with a clear error
        "restic".to_string()
    }

    /// Spawn restic with the given args and env vars.
    /// Returns (run_id, stdout line receiver, completion receiver).
    pub async fn spawn(
        &self,
        run_id: String,
        args: Vec<String>,
        env: Vec<(String, String)>,
    ) -> Result<
        (
            tokio::sync::mpsc::Receiver<String>,
            tokio::sync::mpsc::Receiver<ProcessResult>,
        ),
        ResticError,
    > {
        debug!("Spawning restic with args: {:?}", args);

        let mut cmd = Command::new(&self.restic_binary);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        for (key, value) in &env {
            cmd.env(key, value);
        }

        let mut child = cmd.spawn().map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ResticError::BinaryNotFound(self.restic_binary.clone())
            } else {
                ResticError::IoError(e.to_string())
            }
        })?;

        let stdout = child.stdout.take().expect("stdout was piped");
        let stderr = child.stderr.take().expect("stderr was piped");

        let (cancel_tx, cancel_rx) = oneshot::channel::<()>();

        // Store the running process
        {
            let mut running = self.running.lock().await;
            running.insert(
                run_id.clone(),
                RunningProcess {
                    child,
                    cancel_tx: Some(cancel_tx),
                },
            );
        }

        // Channel for streaming stdout lines
        let (line_tx, line_rx) = tokio::sync::mpsc::channel::<String>(256);
        // Channel for the final result
        let (result_tx, result_rx) = tokio::sync::mpsc::channel::<ProcessResult>(1);

        let running_ref = self.running.clone();
        let run_id_clone = run_id.clone();

        // Spawn a task to read stdout, stderr, and wait for exit
        tokio::spawn(async move {
            let mut stdout_reader = BufReader::new(stdout).lines();
            let mut _stderr_lines: Vec<String> = Vec::new();

            // Read stderr in a separate task
            let stderr_handle = tokio::spawn(async move {
                let mut reader = BufReader::new(stderr).lines();
                let mut lines = Vec::new();
                while let Ok(Some(line)) = reader.next_line().await {
                    lines.push(line);
                }
                lines
            });

            // Read stdout lines, respecting cancellation
            let cancelled;
            tokio::select! {
                _ = async {
                    while let Ok(Some(line)) = stdout_reader.next_line().await {
                        if line_tx.send(line).await.is_err() {
                            break; // Receiver dropped
                        }
                    }
                } => {
                    cancelled = false;
                }
                _ = cancel_rx => {
                    cancelled = true;
                }
            }

            // Wait for process exit
            let mut running = running_ref.lock().await;
            let result = if let Some(mut proc) = running.remove(&run_id_clone) {
                if cancelled {
                    // Kill the process
                    let _ = proc.child.kill().await;
                    ProcessResult {
                        exit_code: -1,
                        stderr: "Operation cancelled".to_string(),
                        cancelled: true,
                    }
                } else {
                    let status = proc.child.wait().await;
                    let stderr = stderr_handle.await.unwrap_or_default();
                    let exit_code = status
                        .map(|s| s.code().unwrap_or(-1))
                        .unwrap_or(-1);
                    ProcessResult {
                        exit_code,
                        stderr: stderr.join("\n"),
                        cancelled: false,
                    }
                }
            } else {
                warn!("Process {} not found in running map", run_id_clone);
                ProcessResult {
                    exit_code: -1,
                    stderr: "Process not found".to_string(),
                    cancelled: false,
                }
            };

            if let Err(e) = result_tx.send(result).await {
                error!("Failed to send process result: {}", e);
            }
        });

        Ok((line_rx, result_rx))
    }

    /// Cancel a running operation by run_id.
    pub async fn cancel(&self, run_id: &str) -> bool {
        let mut running = self.running.lock().await;
        if let Some(proc) = running.get_mut(run_id) {
            if let Some(tx) = proc.cancel_tx.take() {
                let _ = tx.send(());
                return true;
            }
        }
        false
    }

    /// Run a restic command to completion and return stdout + exit code.
    /// For non-streaming commands (snapshots, stats, version, etc.).
    pub async fn run_to_completion(
        &self,
        args: Vec<String>,
        env: Vec<(String, String)>,
    ) -> Result<(String, i32), ResticError> {
        debug!("Running restic to completion: {:?}", args);

        let mut cmd = Command::new(&self.restic_binary);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        for (key, value) in &env {
            cmd.env(key, value);
        }

        let output = cmd.output().await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ResticError::BinaryNotFound(self.restic_binary.clone())
            } else {
                ResticError::IoError(e.to_string())
            }
        })?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code().unwrap_or(-1);

        if exit_code != 0 && exit_code != 3 {
            return Err(ResticError::from_exit_code(exit_code, &stderr, ""));
        }

        Ok((stdout, exit_code))
    }
}

#[derive(Debug, Clone)]
pub struct ProcessResult {
    pub exit_code: i32,
    pub stderr: String,
    pub cancelled: bool,
}
