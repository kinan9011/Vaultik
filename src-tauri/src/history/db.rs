use chrono::{DateTime, Utc};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

use crate::profile::store::config_dir;

pub struct Database {
    conn: Mutex<Connection>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunRecord {
    pub id: i64,
    pub profile_id: String,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub trigger: String,
    pub operation: String,
    pub exit_code: Option<i32>,
    pub snapshot_id: Option<String>,
    pub summary: Option<String>,
    pub errors: Option<String>,
}

impl Database {
    pub fn open() -> Result<Self, String> {
        let dir = config_dir();
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create config dir: {e}"))?;

        let db_path = dir.join("history.db");
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {e}"))?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS run_history (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id  TEXT NOT NULL,
                started_at  TEXT NOT NULL,
                finished_at TEXT,
                trigger_src TEXT NOT NULL,
                operation   TEXT NOT NULL,
                exit_code   INTEGER,
                snapshot_id TEXT,
                summary     TEXT,
                errors      TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_run_profile ON run_history(profile_id);
            CREATE INDEX IF NOT EXISTS idx_run_started ON run_history(started_at);",
        )
        .map_err(|e| format!("Failed to create tables: {e}"))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn insert_run(
        &self,
        profile_id: &str,
        trigger: &str,
        operation: &str,
    ) -> Result<i64, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO run_history (profile_id, started_at, trigger_src, operation)
             VALUES (?1, ?2, ?3, ?4)",
            params![profile_id, now, trigger, operation],
        )
        .map_err(|e| format!("Failed to insert run: {e}"))?;
        Ok(conn.last_insert_rowid())
    }

    pub fn finish_run(
        &self,
        id: i64,
        exit_code: i32,
        snapshot_id: Option<&str>,
        summary: Option<&str>,
        errors: Option<&str>,
    ) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE run_history SET finished_at = ?1, exit_code = ?2,
             snapshot_id = ?3, summary = ?4, errors = ?5 WHERE id = ?6",
            params![now, exit_code, snapshot_id, summary, errors, id],
        )
        .map_err(|e| format!("Failed to update run: {e}"))?;
        Ok(())
    }

    pub fn get_history(
        &self,
        profile_id: Option<&str>,
        limit: u32,
    ) -> Result<Vec<RunRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let (sql, param_values): (String, Vec<Box<dyn rusqlite::types::ToSql>>) =
            if let Some(pid) = profile_id {
                (
                    "SELECT id, profile_id, started_at, finished_at, trigger_src,
                            operation, exit_code, snapshot_id, summary, errors
                     FROM run_history WHERE profile_id = ?1
                     ORDER BY started_at DESC LIMIT ?2"
                        .to_string(),
                    vec![Box::new(pid.to_string()), Box::new(limit)],
                )
            } else {
                (
                    "SELECT id, profile_id, started_at, finished_at, trigger_src,
                            operation, exit_code, snapshot_id, summary, errors
                     FROM run_history ORDER BY started_at DESC LIMIT ?1"
                        .to_string(),
                    vec![Box::new(limit)],
                )
            };

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            param_values.iter().map(|p| p.as_ref()).collect();

        let rows = stmt
            .query_map(param_refs.as_slice(), |row| {
                Ok(RunRecord {
                    id: row.get(0)?,
                    profile_id: row.get(1)?,
                    started_at: row.get(2)?,
                    finished_at: row.get(3)?,
                    trigger: row.get(4)?,
                    operation: row.get(5)?,
                    exit_code: row.get(6)?,
                    snapshot_id: row.get(7)?,
                    summary: row.get(8)?,
                    errors: row.get(9)?,
                })
            })
            .map_err(|e| format!("Failed to query history: {e}"))?;

        let mut records = Vec::new();
        for row in rows {
            records.push(row.map_err(|e| format!("Failed to read row: {e}"))?);
        }
        Ok(records)
    }

    pub fn get_last_run(&self, profile_id: &str) -> Result<Option<RunRecord>, String> {
        let records = self.get_history(Some(profile_id), 1)?;
        Ok(records.into_iter().next())
    }
}
