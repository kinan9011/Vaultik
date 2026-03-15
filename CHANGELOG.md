# Changelog

All notable changes to Vaultik will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-03-15

### Added

- Initial release of Vaultik desktop application
- **Setup Wizard** — guided first-run experience to create a backup profile
- **Backup Profiles** — create, edit, and delete profiles with per-profile sources, excludes, retention, and schedule
- **Live Backup Progress** — real-time progress bar, file counters, ETA, and error tracking via restic `--json` output
- **Snapshot Browser** — browse snapshot contents in a lazy-loaded tree view with expand/collapse
- **Selective Restore** — pick files and folders from any snapshot and restore to a target directory with progress tracking
- **Scheduling** — automatic backups via OS-native schedulers (systemd timers on Linux, launchd on macOS, Task Scheduler on Windows)
- **Pause / Resume** — temporarily disable a profile's schedule without losing configuration
- **Retention Policies** — keep-last, hourly, daily, weekly, monthly, yearly with optional auto-prune after backup
- **Health Dashboard** — at-a-glance status for all profiles (healthy / warning / failed / paused / never run)
- **Run History** — searchable log of every backup, restore, and check operation stored in SQLite
- **Desktop Notifications** — success, failure, and partial completion alerts via OS notification system
- **Repository Check** — verify repository integrity with optional read-data-subset
- **Dark / Light Theme** — follows system preference with manual toggle in settings
- **OS Keyring Integration** — passwords stored securely in libsecret (Linux), Keychain (macOS), Credential Manager (Windows)
- **Restic CLI Wrapper** — typed Rust process manager that spawns restic with `--json`, parses streaming output, and maps exit codes to semantic errors
- **Multi-backend Support** — local, SFTP, S3, B2, Azure, GCS, Swift, rclone, and REST server backends
- **Cross-platform Builds** — .deb, AppImage (Linux), .dmg, .app (macOS), .msi, .exe (Windows)

[Unreleased]: https://github.com/kinan9011/Vaultik/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kinan9011/Vaultik/releases/tag/v0.1.0
