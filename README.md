<p align="center">
  <img src="public/vaultik.svg" width="80" height="80" alt="Vaultik">
</p>

<h1 align="center">Vaultik</h1>

<p align="center">
  <strong>Encrypted backups, beautifully simple.</strong>
</p>

<p align="center">
  A modern desktop GUI for <a href="https://restic.net">restic</a> backup.<br>
  Create profiles, schedule backups, browse snapshots, and restore files — all from a clean interface.<br>
  Your data is encrypted before it ever leaves your machine.
</p>

<p align="center">
  <a href="https://github.com/kinan9011/Vaultik/releases">Download</a> &middot;
  <a href="https://github.com/kinan9011/Vaultik/wiki">Documentation</a> &middot;
  <a href="https://github.com/kinan9011/Vaultik/issues">Report Bug</a>
</p>

---

## Features

- **Setup Wizard** — go from install to first backup in under 3 minutes
- **Backup Profiles** — configure sources, excludes, retention, and schedule per profile
- **Live Progress** — real-time progress bar, file counters, ETA, error tracking
- **Snapshot Browser** — browse snapshot contents in a tree view with expand/collapse
- **Selective Restore** — pick files/folders from any snapshot and restore to a target directory
- **Scheduling** — automatic backups via OS-native schedulers (systemd / launchd / Task Scheduler)
- **Pause / Resume** — temporarily disable a profile without losing its schedule
- **Retention Policies** — keep-last, hourly, daily, weekly, monthly, yearly with auto-prune
- **Health Dashboard** — at-a-glance status for all profiles (healthy / warning / failed / paused)
- **Run History** — searchable log of every backup, restore, and check with full details
- **Desktop Notifications** — get notified on success, failure, or partial completion
- **Repository Check** — verify repository integrity with optional data subset reads
- **Dark / Light Theme** — follows system preference or manual toggle
- **OS Keyring** — passwords stored securely in libsecret / Keychain / Credential Manager

## How It Works

Vaultik wraps the `restic` CLI. It spawns restic with `--json` and parses the streaming output for real-time progress. This means:

- Any installed restic binary works (you bring your own, or Vaultik finds it on PATH)
- All restic features and backends are supported (local, SFTP, S3, B2, Azure, GCS, Swift, rclone, REST)
- Upgrade restic independently of Vaultik
- No data ever passes through Vaultik's servers — there are no servers

---

## Getting Started

### 1. Install restic

Vaultik requires `restic` installed on your system.

```bash
# Debian / Ubuntu
sudo apt install restic

# Fedora
sudo dnf install restic

# Arch
sudo pacman -S restic

# macOS
brew install restic

# Windows (scoop)
scoop install restic
```

Verify it works:

```bash
restic version
```

### 2. Install Vaultik

Download the latest release for your platform from [Releases](https://github.com/kinan9011/Vaultik/releases), or build from source (see [Building](#building) below).

### 3. First Backup (Setup Wizard)

When you launch Vaultik with no profiles, the Dashboard shows two options: **Setup Wizard** and **Manual Setup**. The wizard walks you through everything in 6 steps:

1. **What to back up** — name your profile, add source directories
2. **Where to store it** — pick a backend (local, SFTP, S3, B2, REST, etc.) and enter the repo URL
3. **Security** — set an encryption password (stored in your OS keyring)
4. **Schedule** — optionally enable automatic backups (hourly, daily, weekly)
5. **Retention** — choose a cleanup preset (conservative, moderate, or minimal)
6. **Review & Create** — confirm settings, then Vaultik initializes the repo and starts your first backup

The whole process takes under 3 minutes.

---

## User Guide

### Dashboard

The Dashboard is the home screen. It shows:

- **Health summary** — counts of healthy, failed, and never-run profiles
- **Active backup progress** — when a backup is running, a live progress bar shows percentage, files processed, data transferred, ETA, current file, and error count. You can cancel at any time.
- **Profile cards** — each profile displays its status dot, name, repo URL, source count, schedule status, and last run time. Actions per card:
  - **Pause / Resume** — temporarily stop scheduled backups without deleting the profile
  - **Snapshots** — jump to the snapshot browser
  - **Run Now** — start an immediate backup

Status dots indicate health at a glance:
- Green = last backup succeeded
- Yellow = completed with warnings
- Red = last backup failed
- Gray = never run
- Dimmed = paused

### Backup Profiles

Each profile is an independent backup configuration. Click a profile name on the Dashboard to edit it. Profiles contain:

**General** — profile name

**Execution Mode** — where restic runs:
- **Local** (default) — restic runs on this machine
- **Remote (SSH)** — restic runs on a remote server via SSH. Configure the SSH host, port, identity key, and remote restic path. Use "Test SSH Connection" to verify connectivity and that restic is available on the server.

**Repository** — the storage backend URL and encryption password. Supported formats:
| Backend | URL format |
|---------|-----------|
| Local / USB | `/mnt/backup/repo` |
| SFTP | `sftp:user@host:/backup/repo` |
| S3 / MinIO | `s3:s3.amazonaws.com/bucket-name` |
| Backblaze B2 | `b2:bucket-name:prefix` |
| Azure | `azure:container-name:prefix` |
| Google Cloud | `gs:bucket-name:/prefix` |
| Swift | `swift:container-name:/prefix` |
| rclone | `rclone:remote:path` |
| REST Server | `rest:http://host:8000/` |

Use "Test Connection" to verify access. For new repos, use "Init New Repo" to create the repository structure.

**Backup Sources** — list of directories to back up. Add paths one at a time.

**Exclusions** — glob patterns to skip (e.g., `*.tmp`, `node_modules`, `.cache`). Options:
- Exclude cache directories (CACHEDIR.TAG)
- Stay on one filesystem

**Retention Policy** — how many snapshots to keep per time interval:
| Field | Meaning |
|-------|---------|
| Keep Last | keep the N most recent snapshots |
| Keep Hourly | keep one snapshot per hour for the last N hours |
| Keep Daily | keep one per day for N days |
| Keep Weekly | keep one per week for N weeks |
| Keep Monthly | keep one per month for N months |
| Keep Yearly | keep one per year for N years |

Enable "Auto-prune after forget" to reclaim disk space automatically.

**Schedule** — enable automatic backups with a frequency (hourly, daily, weekly, or custom cron). Vaultik installs OS-native timers:
- **Linux**: systemd user timers (`~/.config/systemd/user/`)
- **macOS**: launchd agents (`~/Library/LaunchAgents/`)
- **Windows**: Task Scheduler

You can toggle success and failure notifications per schedule.

**Health Checks** — optionally run `restic check` after every backup. Set a data subset (e.g., `5%` or `1/10`) to check a random sample instead of all data.

**Advanced** — compression level, upload/download speed limits, read concurrency, tags, and hostname override.

### Snapshot Browser

Navigate to **Snapshots** from a profile card on the Dashboard.

**Left panel** — lists all snapshots (newest first). Each shows the short ID, timestamp, paths, hostname, and a file/size summary. Click a snapshot to browse its contents. Click "forget" to remove a snapshot from the repository.

**Right panel** — file tree with expand/collapse. Shows name, type, size, and modification date. Select individual files or folders using checkboxes, then:
- **Restore Selected** — restore only checked items
- **Restore All** — restore the entire snapshot

The restore dialog lets you:
1. Choose a target directory
2. Optionally verify files after restore
3. Monitor progress with a live progress bar
4. Cancel mid-restore if needed

### Run History

The **Run History** page logs every operation (backup, restore, check, forget). Filter by profile using the dropdown.

Each entry shows:
- Status badge (success, partial, failed, running)
- Operation type and trigger (manual vs. scheduled)
- Duration and timestamps
- Expand to see: snapshot ID, file counts (new/changed/unchanged), data added, total duration, and any errors

### Settings

**Appearance** — toggle between light and dark theme (follows system preference by default).

**Restic Binary** — shows the detected restic version. Optionally set a custom path if restic is not on your PATH.

**Data Management**:
- **Export Profiles** — save all profiles to a JSON file for backup or migration. Passwords are not included.
- **Import Profiles** — load profiles from a previously exported file. Duplicates (same name) are skipped.

### Remote SSH Execution

Vaultik can run restic on a remote server over SSH. This is useful when:
- Your data lives on the server and you want to back it up without transferring it to your local machine
- The repository is local to the server (faster access)
- You manage backups for multiple servers from one desktop

**Setup:**
1. Edit a profile and set Execution Mode to "Remote server (SSH)"
2. Enter the SSH host (e.g., `user@192.168.1.10` or a hostname from `~/.ssh/config`)
3. Optionally set the port, identity key, and remote restic path
4. Click "Test SSH Connection" to verify

**Requirements:**
- SSH key-based authentication must be configured (Vaultik uses `BatchMode=yes` and will not prompt for passwords)
- `restic` must be installed on the remote server
- The remote user needs read access to the backup sources

All operations (backup, restore, check, snapshots, forget) work identically whether local or remote. The Dashboard shows a "remote" badge on remote profiles.

### Password Storage

Vaultik supports three ways to provide the repository encryption password:

| Method | How it works | When to use |
|--------|-------------|-------------|
| **OS Keyring** (default) | Stored in libsecret (Linux), Keychain (macOS), or Credential Manager (Windows) | Recommended for most users |
| **Password File** | Reads from a plaintext file at a given path | Headless/automated setups |
| **Password Command** | Runs a shell command and uses its output | Integration with secret managers (Vault, pass, etc.) |

### Notifications

Vaultik sends desktop notifications after backups complete:
- **Success**: profile name, new file count, data added
- **Partial**: profile name, warning/error count
- **Failure**: profile name, error message

Notifications can be toggled per-profile in the schedule settings.

### Data Storage

| What | Where | Format |
|------|-------|--------|
| Profiles | `~/.config/vaultik/profiles/` | JSON (one file per profile) |
| Run history | `~/.local/share/vaultik/history.db` | SQLite |
| Passwords | OS keyring | Encrypted by the OS |

---

## FAQ

### General

**Q: Does Vaultik store or transmit my data?**
No. Vaultik is a local desktop app with no servers and no telemetry. It calls the `restic` binary on your machine (or a remote server via SSH). Your data goes directly from source to repository, encrypted by restic before it leaves.

**Q: Can I use my existing restic repositories?**
Yes. When creating a profile, just enter the URL of an existing repository and your password. Vaultik will detect it and work with your existing snapshots.

**Q: What happens if I uninstall Vaultik?**
Your restic repositories are untouched. Profiles are stored in `~/.config/vaultik/` and can be deleted manually. You can always access your backups directly using the `restic` CLI.

**Q: Can I run Vaultik and the restic CLI side by side?**
Yes. Vaultik does not lock repositories. You can use both interchangeably. However, avoid running two operations on the same repository at the same time (restic will lock the repo and the second operation will fail).

### Backups

**Q: How do I back up to a remote server?**
You have two options:
1. **Remote repository** (restic runs locally, stores data remotely) — just enter a remote repo URL like `sftp:user@host:/backup` or `s3:...` in the repository field. Restic handles the remote connection.
2. **Remote execution** (restic runs on the server via SSH) — set the execution mode to "Remote server (SSH)" in the profile editor. This is better when the data to back up lives on the server.

**Q: How do I back up multiple directories?**
Add each directory as a separate source in the profile editor. All sources are included in the same backup snapshot.

**Q: What does "exclude caches" do?**
It tells restic to skip directories that contain a `CACHEDIR.TAG` file. Many applications (build tools, package managers) mark their cache directories this way.

**Q: Can I limit bandwidth usage?**
Yes. In the profile editor under Advanced Settings, set upload and/or download limits in KiB/s.

### Snapshots & Restore

**Q: How do I restore a single file?**
Go to Snapshots for the profile, select a snapshot, browse the file tree, check the file(s) you want, and click "Restore Selected". Choose a target directory and Vaultik will extract only those files.

**Q: What does "Verify" do during restore?**
When enabled, restic re-reads the restored files after writing them and compares their checksums against the repository to confirm the restore was successful.

**Q: Can I delete old snapshots?**
Yes. In the Snapshot Browser, click "forget" next to a snapshot to remove it. To automatically clean up old snapshots, configure a retention policy in the profile editor.

### Scheduling

**Q: How does scheduling work?**
Vaultik creates OS-native scheduled tasks. On Linux, it writes systemd user timer and service units. On macOS, launchd plist files. On Windows, Task Scheduler entries. These run independently of Vaultik being open.

**Q: What happens if my computer is off at the scheduled time?**
On Linux with systemd, the timer has `Persistent=true`, so the backup will run shortly after the computer starts. macOS and Windows have similar catch-up behavior depending on OS settings.

**Q: What does "Pause" do?**
Pausing a profile uninstalls its OS timer so scheduled backups stop. The profile config is preserved. Resuming reinstalls the timer. You can still run manual backups on a paused profile.

### Remote (SSH)

**Q: Why does "Test SSH Connection" fail?**
Common causes:
- SSH key-based authentication is not configured (Vaultik uses `BatchMode=yes` and cannot prompt for passwords)
- The host is unreachable or the port is wrong
- `restic` is not installed on the remote server, or is not on the remote user's PATH (set a custom path in the profile)
- `~/.ssh/config` host aliases work — make sure the alias resolves correctly

**Q: Is the restic password secure over SSH?**
The password is passed as an environment variable in the remote command (`env RESTIC_PASSWORD=... restic ...`). It is visible in `ps` on the remote server for the duration of the command. If this is a concern, use `--password-command` via the password file or command storage method instead.

**Q: Can I use SSH agent forwarding?**
Yes. Since Vaultik uses the system `ssh` binary, it respects your `~/.ssh/config`, SSH agent, `ProxyJump`, and all other SSH features.

### Troubleshooting

**Q: Vaultik says "restic not found"**
Install restic and make sure it is on your PATH. Run `restic version` in a terminal to verify. If restic is installed in a non-standard location, set the path in Settings.

**Q: Backup fails with "repository is locked"**
Another restic process is running against the same repository. Wait for it to finish, or run `restic unlock --repo <url>` manually if you are certain no process is active.

**Q: The profile editor shows a password error but I entered the right password**
Passwords are stored in your OS keyring under the service "vaultik". If the keyring entry was deleted or the keyring daemon is not running, Vaultik cannot retrieve the password. Re-enter the password by creating a new profile or updating the keyring manually.

**Q: Scheduled backups are not running**
- **Linux**: Check with `systemctl --user list-timers` that the timer is active. Look at `journalctl --user -u vaultik-<profile-id>` for errors.
- **macOS**: Check `launchctl list | grep vaultik`.
- Make sure the profile is not paused (check the Dashboard for a "paused" badge).

**Q: How do I see debug logs?**
Set the `DEBUG_LOG` environment variable before launching Vaultik:
```bash
DEBUG_LOG=/tmp/vaultik-debug.log RUST_LOG=debug vaultik
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | [Tauri v2](https://v2.tauri.app) |
| Backend | Rust (tokio, rusqlite, keyring, notify-rust) |
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Scheduling | systemd timers (Linux), launchd (macOS), Task Scheduler (Windows) |
| Storage | JSON profiles in `~/.config/vaultik/`, SQLite for run history |

---

## Prerequisites

- [restic](https://restic.net/installation/) installed and available on PATH
- [Rust](https://rustup.rs/) 1.70+
- [Node.js](https://nodejs.org/) 18+
- Platform-specific Tauri dependencies (see below)

### Linux dependencies

```bash
# Debian / Ubuntu
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libappindicator3-dev \
  librsvg2-dev libssl-dev libjavascriptcoregtk-4.1-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel gtk3-devel libappindicator-gtk3-devel \
  librsvg2-devel openssl-devel

# Arch
sudo pacman -S webkit2gtk-4.1 gtk3 libappindicator-gtk3 librsvg openssl
```

### macOS dependencies

```bash
xcode-select --install
```

### Windows dependencies

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10/11)

---

## Development

```bash
cd gui

# Install frontend dependencies
npm install

# Run in development mode (hot-reload frontend + Rust backend)
npx tauri dev
```

This opens the app window with hot-reload. Frontend changes reflect instantly; Rust changes trigger a recompile.

### Useful commands

```bash
# Type-check frontend
npx tsc --noEmit

# Build frontend only
npm run build

# Check Rust only
cargo check --manifest-path src-tauri/Cargo.toml

# Format
npm run format
cargo fmt --manifest-path src-tauri/Cargo.toml
```

---

## Building

### Linux — .deb and AppImage

```bash
cd gui
npm install
npx tauri build
```

Output:
```
src-tauri/target/release/bundle/deb/vaultik_0.1.0_amd64.deb
src-tauri/target/release/bundle/appimage/vaultik_0.1.0_amd64.AppImage
```

Install the .deb:
```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/vaultik_0.1.0_amd64.deb
```

Run the AppImage:
```bash
chmod +x vaultik_0.1.0_amd64.AppImage
./vaultik_0.1.0_amd64.AppImage
```

### Linux — Flatpak

1. Install Flatpak build tools:
```bash
sudo apt install flatpak flatpak-builder
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install flathub org.freedesktop.Platform//24.08 org.freedesktop.Sdk//24.08
```

2. Create `dev.kinan.vaultik.yml` in the project root:
```yaml
app-id: dev.kinan.vaultik
runtime: org.freedesktop.Platform
runtime-version: '24.08'
sdk: org.freedesktop.Sdk
command: vaultik
finish-args:
  - --share=ipc
  - --socket=fallback-x11
  - --socket=wayland
  - --share=network
  - --device=dpi
  - --filesystem=host
  - --talk-name=org.freedesktop.secrets
  - --talk-name=org.freedesktop.Notifications
modules:
  - name: vaultik
    buildsystem: simple
    build-commands:
      - install -Dm755 vaultik /app/bin/vaultik
    sources:
      - type: file
        path: src-tauri/target/release/vaultik
```

3. First build the release binary, then the Flatpak:
```bash
npx tauri build
flatpak-builder --force-clean build-dir dev.kinan.vaultik.yml
flatpak-builder --repo=repo build-dir dev.kinan.vaultik.yml
flatpak --user remote-add --no-gpg-verify vaultik-repo repo
flatpak --user install vaultik-repo dev.kinan.vaultik
```

4. Run:
```bash
flatpak run dev.kinan.vaultik
```

### Linux — Snap

1. Create `snap/snapcraft.yaml`:
```yaml
name: vaultik
version: '0.1.0'
summary: Encrypted backups, beautifully simple
description: |
  A modern desktop GUI for restic backup. Create profiles, schedule
  backups, browse snapshots, and restore files.
base: core22
grade: stable
confinement: strict

apps:
  vaultik:
    command: bin/vaultik
    extensions: [gnome]
    plugs:
      - home
      - removable-media
      - network
      - password-manager-service
      - desktop
      - desktop-legacy

parts:
  vaultik:
    plugin: dump
    source: src-tauri/target/release/
    organize:
      vaultik: bin/vaultik
    stage-packages:
      - libwebkit2gtk-4.1-0
      - libgtk-3-0
```

2. Build:
```bash
npx tauri build
snapcraft
```

3. Install:
```bash
sudo snap install vaultik_0.1.0_amd64.snap --dangerous
```

### Windows — .msi and .exe installer

```powershell
cd gui
npm install
npx tauri build
```

Output:
```
src-tauri\target\release\bundle\msi\Vaultik_0.1.0_x64_en-US.msi
src-tauri\target\release\bundle\nsis\Vaultik_0.1.0_x64-setup.exe
```

Double-click either installer to install. Vaultik appears in the Start menu.

### macOS — .dmg and .app

```bash
cd gui
npm install
npx tauri build
```

Output:
```
src-tauri/target/release/bundle/dmg/Vaultik_0.1.0_aarch64.dmg
src-tauri/target/release/bundle/macos/Vaultik.app
```

To distribute, sign and notarize:
```bash
# Sign (requires Apple Developer account)
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  src-tauri/target/release/bundle/macos/Vaultik.app

# Notarize
xcrun notarytool submit src-tauri/target/release/bundle/dmg/Vaultik_0.1.0_aarch64.dmg \
  --apple-id "you@example.com" --team-id "TEAM_ID" --password "app-specific-password" --wait
```

### Cross-compilation

Build for a different target from Linux:

```bash
# Windows (requires mingw-w64)
rustup target add x86_64-pc-windows-gnu
npx tauri build --target x86_64-pc-windows-gnu

# macOS cross-compilation requires osxcross or building on a Mac
```

---

## Project Structure

```
gui/
├── src/                        # React frontend
│   ├── pages/                  # Dashboard, ProfileEditor, SnapshotBrowser,
│   │                           #   RunHistory, Settings, Wizard
│   ├── components/             # Sidebar, ProgressBar
│   ├── hooks/                  # useResticEvents, useTheme
│   └── lib/
│       ├── config.ts           # ** All branding, links, version — edit here **
│       ├── tauri.ts            # Typed IPC wrappers
│       └── types.ts            # TypeScript type definitions
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── restic/             # CLI wrapper: command builder, process manager,
│   │   │                       #   JSON types, exit code mapping
│   │   ├── profile/            # Profile CRUD (JSON files)
│   │   ├── history/            # Run history (SQLite)
│   │   ├── schedule/           # OS scheduler (systemd/launchd/Task Scheduler)
│   │   ├── password/           # OS keyring integration
│   │   ├── notify/             # Desktop notifications
│   │   └── commands.rs         # Tauri IPC command handlers
│   └── tauri.conf.json         # Tauri configuration
├── package.json
└── README.md
```

## Configuration

All branding, links, and version strings are centralized in a single file:

```
src/lib/config.ts
```

Edit `APP`, `DEVELOPER`, `LINKS`, and `LICENSE` to customize the app for your fork.

---

## License

[GNU AFFERO GENERAL PUBLIC LICENSE)](LICENSE)

Copyright &copy; 2026 Kinan. All rights reserved.

Vaultik is open source software licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). You are free to use, modify, and distribute this software.
If you distribute modified versions of the software, or run it as a network service for users, you must make the corresponding source code available under the same AGPL-3.0 license.
This software is provided without warranty. See the AGPL-3.0 license text for full terms and conditions.

---

## Support

If Vaultik is useful to you, consider supporting development:

<a href="https://buymeacoffee.com/swovo"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee"></a>
<a href="https://ko-fi.com/swovo"><img src="https://img.shields.io/badge/Ko--fi-13C3FF?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
<a href="https://patreon.com/swovo"><img src="https://img.shields.io/badge/Patreon-FF424D?style=for-the-badge&logo=patreon&logoColor=white" alt="Patreon"></a>

Patreon supporters can request individual features and vote on the roadmap.
