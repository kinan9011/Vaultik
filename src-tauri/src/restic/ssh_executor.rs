use std::process::Stdio;

use log::{debug, error};
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::{mpsc, oneshot};

use super::error::ResticError;
use super::executor::{CancelRegistry, ProcessResult, ResticExecutor};

/// Configuration for a remote SSH host.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshConfig {
    pub host: String,
    pub port: Option<u16>,
    pub identity_file: Option<String>,
    pub remote_restic_path: Option<String>,
}

/// Executes restic commands on a remote host via SSH.
pub struct SshExecutor {
    config: SshConfig,
    cancel_registry: CancelRegistry,
}

impl SshExecutor {
    pub fn new(config: SshConfig, cancel_registry: CancelRegistry) -> Self {
        Self {
            config,
            cancel_registry,
        }
    }

    /// Build the argument list for the ssh command.
    fn build_ssh_args(&self, restic_args: &[String], env: &[(String, String)]) -> Vec<String> {
        let mut ssh_args = Vec::new();

        // SSH connection options
        ssh_args.push("-o".to_string());
        ssh_args.push("BatchMode=yes".to_string());
        ssh_args.push("-o".to_string());
        ssh_args.push("StrictHostKeyChecking=accept-new".to_string());

        if let Some(port) = self.config.port {
            ssh_args.push("-p".to_string());
            ssh_args.push(port.to_string());
        }

        if let Some(ref key) = self.config.identity_file {
            ssh_args.push("-i".to_string());
            ssh_args.push(key.clone());
        }

        ssh_args.push(self.config.host.clone());

        // Build the remote command string
        let restic_bin = self
            .config
            .remote_restic_path
            .as_deref()
            .unwrap_or("restic");

        let mut remote_cmd = String::new();

        // Prefix with env vars
        for (key, value) in env {
            remote_cmd.push_str(&format!("{}={} ", key, shell_escape(value)));
        }

        remote_cmd.push_str(restic_bin);

        for arg in restic_args {
            remote_cmd.push(' ');
            remote_cmd.push_str(&shell_escape(arg));
        }

        ssh_args.push(remote_cmd);
        ssh_args
    }
}

#[async_trait::async_trait]
impl ResticExecutor for SshExecutor {
    async fn spawn(
        &self,
        run_id: String,
        args: Vec<String>,
        env: Vec<(String, String)>,
    ) -> Result<
        (
            mpsc::Receiver<String>,
            mpsc::Receiver<ProcessResult>,
        ),
        ResticError,
    > {
        let ssh_args = self.build_ssh_args(&args, &env);
        debug!("Spawning SSH restic: ssh {:?}", ssh_args);

        let mut cmd = Command::new("ssh");
        cmd.args(&ssh_args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        let mut child = cmd.spawn().map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ResticError::IoError("ssh binary not found on local system".to_string())
            } else {
                ResticError::IoError(format!("SSH error: {e}"))
            }
        })?;

        let stdout = child.stdout.take().expect("stdout was piped");
        let stderr = child.stderr.take().expect("stderr was piped");

        let (cancel_tx, cancel_rx) = oneshot::channel::<()>();
        self.cancel_registry
            .register(run_id.clone(), cancel_tx)
            .await;

        let (line_tx, line_rx) = mpsc::channel::<String>(256);
        let (result_tx, result_rx) = mpsc::channel::<ProcessResult>(1);

        let cancel_registry = self.cancel_registry.clone();
        let run_id_clone = run_id.clone();

        tokio::spawn(async move {
            let mut stdout_reader = BufReader::new(stdout).lines();

            let stderr_handle = tokio::spawn(async move {
                let mut reader = BufReader::new(stderr).lines();
                let mut lines = Vec::new();
                while let Ok(Some(line)) = reader.next_line().await {
                    lines.push(line);
                }
                lines
            });

            let cancelled;
            tokio::select! {
                _ = async {
                    while let Ok(Some(line)) = stdout_reader.next_line().await {
                        if line_tx.send(line).await.is_err() {
                            break;
                        }
                    }
                } => {
                    cancelled = false;
                }
                _ = cancel_rx => {
                    cancelled = true;
                }
            }

            cancel_registry.remove(&run_id_clone).await;

            let result = if cancelled {
                let _ = child.kill().await;
                ProcessResult {
                    exit_code: -1,
                    stderr: "Operation cancelled".to_string(),
                    cancelled: true,
                }
            } else {
                let status = child.wait().await;
                let stderr_lines = stderr_handle.await.unwrap_or_default();
                let exit_code = status
                    .map(|s| s.code().unwrap_or(-1))
                    .unwrap_or(-1);
                ProcessResult {
                    exit_code,
                    stderr: stderr_lines.join("\n"),
                    cancelled: false,
                }
            };

            if let Err(e) = result_tx.send(result).await {
                error!("Failed to send SSH process result: {}", e);
            }
        });

        Ok((line_rx, result_rx))
    }

    async fn run_to_completion(
        &self,
        args: Vec<String>,
        env: Vec<(String, String)>,
    ) -> Result<(String, i32), ResticError> {
        let ssh_args = self.build_ssh_args(&args, &env);
        debug!("Running SSH restic to completion: ssh {:?}", ssh_args);

        let mut cmd = Command::new("ssh");
        cmd.args(&ssh_args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let output = cmd.output().await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ResticError::IoError("ssh binary not found on local system".to_string())
            } else {
                ResticError::IoError(format!("SSH error: {e}"))
            }
        })?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code().unwrap_or(-1);

        // SSH connection failures return exit code 255
        if exit_code == 255 {
            return Err(ResticError::IoError(format!(
                "SSH connection failed: {}",
                stderr.trim()
            )));
        }

        if exit_code != 0 && exit_code != 3 {
            return Err(ResticError::from_exit_code(exit_code, &stderr, ""));
        }

        Ok((stdout, exit_code))
    }
}

/// Shell-escape a string for safe inclusion in a remote SSH command.
fn shell_escape(s: &str) -> String {
    if s.chars().all(|c| {
        c.is_alphanumeric() || matches!(c, '-' | '_' | '/' | '.' | ':' | ',' | '@' | '=' | '+')
    }) {
        s.to_string()
    } else {
        format!("'{}'", s.replace('\'', "'\\''"))
    }
}
