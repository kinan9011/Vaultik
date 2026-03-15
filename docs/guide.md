# Vaultik Documentation

**Encrypted backups, beautifully simple.**

Vaultik is a modern desktop application for [restic](https://restic.net) backup. It provides a clean graphical interface for creating backup profiles, scheduling automatic backups, browsing snapshots, and restoring files — all with end-to-end encryption.

---

## Table of Contents

- [What Is Vaultik](#what-is-vaultik)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Download](#download)
  - [Linux](#linux)
  - [macOS](#macos)
  - [Windows](#windows)
  - [Build from Source](#build-from-source)
- [Quick Start](#quick-start)
- [The Dashboard](#the-dashboard)
  - [Health Summary](#health-summary)
  - [Profile Cards](#profile-cards)
  - [Live Backup Progress](#live-backup-progress)
- [Setup Wizard](#setup-wizard)
  - [Step 1: What to Back Up](#step-1-what-to-back-up)
  - [Step 2: Where to Store It](#step-2-where-to-store-it)
  - [Step 3: Encryption Password](#step-3-encryption-password)
  - [Step 4: Schedule](#step-4-schedule)
  - [Step 5: Retention](#step-5-retention)
  - [Step 6: Review and Create](#step-6-review-and-create)
- [Backup Profiles](#backup-profiles)
  - [Creating a Profile Manually](#creating-a-profile-manually)
  - [Execution Mode (Local vs Remote)](#execution-mode-local-vs-remote)
  - [Repository Configuration](#repository-configuration)
  - [Backup Sources](#backup-sources)
  - [Exclusions](#exclusions)
  - [Retention Policies](#retention-policies)
  - [Scheduling](#scheduling)
  - [Health Checks](#health-checks)
  - [Advanced Settings](#advanced-settings)
  - [Editing an Existing Profile](#editing-an-existing-profile)
  - [Deleting a Profile](#deleting-a-profile)
- [Running Backups](#running-backups)
  - [Manual Backup](#manual-backup)
  - [Scheduled Backups](#scheduled-backups)
  - [Pausing and Resuming](#pausing-and-resuming)
  - [Cancelling a Backup](#cancelling-a-backup)
- [Browsing Snapshots](#browsing-snapshots)
  - [Snapshot List](#snapshot-list)
  - [File Tree Browser](#file-tree-browser)
  - [Deleting Snapshots](#deleting-snapshots)
- [Restoring Files](#restoring-files)
  - [Restore All Files](#restore-all-files)
  - [Selective Restore](#selective-restore)
  - [Restore Options](#restore-options)
  - [Monitoring Restore Progress](#monitoring-restore-progress)
- [Run History](#run-history)
  - [Filtering by Profile](#filtering-by-profile)
  - [Understanding Run Details](#understanding-run-details)
- [Remote Backups via SSH](#remote-backups-via-ssh)
  - [When to Use Remote Execution](#when-to-use-remote-execution)
  - [Setting Up SSH Access](#setting-up-ssh-access)
  - [Configuring a Remote Profile](#configuring-a-remote-profile)
  - [Testing the Connection](#testing-the-connection)
  - [How It Works](#how-remote-execution-works)
- [Supported Storage Backends](#supported-storage-backends)
- [Password Management](#password-management)
  - [OS Keyring (Recommended)](#os-keyring-recommended)
  - [Password File](#password-file)
  - [Password Command](#password-command)
- [Notifications](#notifications)
- [Settings](#settings)
  - [Appearance](#appearance)
  - [Restic Binary](#restic-binary)
  - [Export and Import Profiles](#export-and-import-profiles)
- [Data Storage](#data-storage)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)

---

## What Is Vaultik

Vaultik is a desktop GUI that wraps the [restic](https://restic.net) command-line backup tool. Rather than embedding restic as a library, Vaultik calls the `restic` binary on your system with `--json` output and parses the streaming results in real time. This architecture means:

- **Any restic version works.** You install restic separately. Upgrade it independently of Vaultik.
- **All restic backends are supported.** Local disks, SFTP, S3, Backblaze B2, Azure Blob, Google Cloud Storage, OpenStack Swift, rclone remotes, and REST servers.
- **All data stays between you and your repository.** There are no Vaultik servers. No telemetry. No accounts. Your data is encrypted by restic before it leaves your machine.
- **You are never locked in.** Your repositories are standard restic repositories. You can always access them directly from the command line.

Vaultik stores its own configuration (profiles, run history, preferences) locally on your machine. Passwords are kept in your operating system's secure keyring.

---

## Installation

### Prerequisites

Vaultik requires **restic** to be installed on your system. Vaultik does not bundle restic — it finds and calls the `restic` binary on your PATH.

Install restic for your platform:

| Platform | Command |
|----------|---------|
| Debian / Ubuntu | `sudo apt install restic` |
| Fedora | `sudo dnf install restic` |
| Arch Linux | `sudo pacman -S restic` |
| macOS (Homebrew) | `brew install restic` |
| Windows (Scoop) | `scoop install restic` |
| Windows (Chocolatey) | `choco install restic` |
| Manual | Download from [restic.net](https://restic.net) and place on your PATH |

After installing, verify restic is accessible:

```
restic version
```

You should see output like `restic 0.17.3 compiled with go1.23.4 on linux/amd64`.

### Download

Download the latest Vaultik release for your platform from the [Releases page](https://github.com/kinan9011/Vaultik/releases).

### Linux

**Debian / Ubuntu (.deb)**

```bash
sudo dpkg -i vaultik_0.1.0_amd64.deb
```

Launch from your application menu or run `vaultik` from the terminal.

**AppImage**

```bash
chmod +x Vaultik_0.1.0_amd64.AppImage
./Vaultik_0.1.0_amd64.AppImage
```

No installation required. The AppImage runs directly.

**Flatpak and Snap** packages are also available. See the [README](https://github.com/kinan9011/Vaultik) for detailed instructions.

### macOS

Open the `.dmg` file and drag Vaultik to your Applications folder.

On first launch, macOS may show a security warning. Go to **System Settings > Privacy & Security** and click **Open Anyway**.

### Windows

Run the `.msi` installer or the `.exe` setup file. Vaultik will appear in your Start menu after installation.

Windows 10 and 11 include WebView2 by default. Older versions may require the [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

### Build from Source

Requirements: [Rust](https://rustup.rs/) 1.70+, [Node.js](https://nodejs.org/) 18+, and platform-specific Tauri dependencies.

```bash
git clone https://github.com/kinan9011/Vaultik.git
cd Vaultik
npm install
npx tauri build
```

See the [README](https://github.com/kinan9011/Vaultik) for platform-specific build dependencies.

---

## Quick Start

1. **Install restic** if you haven't already (see [Prerequisites](#prerequisites)).
2. **Launch Vaultik.** The Dashboard opens. With no profiles configured, you'll see an empty state with two buttons.
3. **Click "Setup Wizard."** The wizard walks you through creating your first backup in 6 steps — choosing what to back up, where to store it, setting a password, configuring a schedule, and picking a retention policy.
4. **Wait for the first backup to complete.** Vaultik initializes the repository, starts the backup, and shows live progress on the Dashboard. A desktop notification appears when it finishes.

The entire process takes under 3 minutes.

---

## The Dashboard

The Dashboard is the home screen of Vaultik. It shows the status of all your backup profiles and any running operations.

### Health Summary

When you have at least one profile, three summary cards appear at the top:

| Card | Meaning |
|------|---------|
| **Healthy** (green) | Profiles whose last backup succeeded |
| **Failed** (red) | Profiles whose last backup failed |
| **Never run** (gray) | Profiles that have never been backed up |

### Profile Cards

Each backup profile appears as a card showing:

- **Status dot** — a colored circle indicating health:
  - Green: last backup succeeded
  - Yellow: completed with warnings (some files had errors)
  - Red: last backup failed
  - Gray: never run
  - Dimmed: profile is paused
- **Profile name** — click to open the profile editor
- **Badges** — "remote" (if the profile uses SSH execution) and "paused" (if the schedule is disabled)
- **Repository URL** — the storage backend
- **Source count** — how many directories are being backed up
- **Schedule status** — "Scheduled" or "Manual"
- **Last run** — relative time since the last backup (e.g., "5m ago", "2h ago", "3d ago")
- **Buttons:**
  - **Pause / Resume** — toggle the scheduled backup
  - **Snapshots** — open the snapshot browser
  - **Run Now** — start an immediate backup

When no profiles exist, the Dashboard shows an empty state with buttons for **Setup Wizard** (guided) and **Manual Setup** (advanced).

### Live Backup Progress

When a backup is running, a progress panel appears on the Dashboard showing:

- A visual progress bar with percentage
- File counter: files processed out of total
- Data counter: bytes processed out of total (formatted as KiB, MiB, GiB, etc.)
- Estimated time remaining
- The file currently being processed
- Error count (if any errors occurred during the backup)
- A **Cancel** button to stop the backup

When the backup completes, a summary banner shows the result:
- **Success:** "Backup completed — X new files, Y added"
- **Failure:** "Backup failed (exit code N)"

The banner dismisses automatically after a few seconds.

---

## Setup Wizard

The Setup Wizard is a 6-step guided flow for creating your first backup profile. A progress bar at the top shows which step you're on.

### Step 1: What to Back Up

**"What do you want to back up?"**

Enter a name for your backup profile (e.g., "My Laptop", "Work Projects") and add the directories you want to protect. Type or paste a path and press Enter or click **Add**. Each added path appears as a chip that can be removed.

You need at least one source directory to continue.

### Step 2: Where to Store It

**"Where should backups be stored?"**

Choose a storage backend from the grid:

| Option | URL format |
|--------|-----------|
| Local / USB | `/mnt/backup/restic-repo` |
| SFTP Server | `sftp:user@host:/backup/repo` |
| S3 / MinIO | `s3:s3.amazonaws.com/bucket-name` |
| Backblaze B2 | `b2:bucket-name:prefix` |
| REST Server | `rest:http://host:8000/` |
| Other | Any restic-compatible URL |

After selecting a backend type, enter the repository URL. The input placeholder updates to show the expected format.

The checkbox **"Initialize as new repository"** is enabled by default. Uncheck it if you're connecting to an existing restic repository.

### Step 3: Encryption Password

**"Set encryption password"**

Enter and confirm an encryption password. This password protects all your backup data. **Store it somewhere safe** — without it, your backups cannot be recovered. There is no password reset.

The password is stored in your operating system's keyring (libsecret on Linux, Keychain on macOS, Credential Manager on Windows).

### Step 4: Schedule

**"How often should backups run?"**

Toggle **"Enable automatic backups"** (enabled by default) and choose a frequency:

- **Hourly** — runs every hour
- **Daily** — runs once a day at the time you specify (default: 02:00)
- **Weekly** — runs once a week on a day and time you specify

Vaultik installs an OS-native timer (systemd on Linux, launchd on macOS, Task Scheduler on Windows). Backups run even when Vaultik is not open.

Leave this disabled for manual-only backups.

### Step 5: Retention

**"How many backups to keep?"**

Choose a cleanup preset that determines how long old snapshots are kept before being removed:

| Preset | What it keeps |
|--------|--------------|
| **Conservative** | 7 daily, 4 weekly, 12 monthly, 3 yearly |
| **Moderate** | 3 daily, 4 weekly, 6 monthly |
| **Minimal** | 7 daily, 4 weekly |

Old snapshots outside the retention window are automatically removed (with auto-prune enabled) after each successful backup.

### Step 6: Review and Create

**"Ready to go"**

A summary card shows all your settings. Click **"Create & Run First Backup"** to:

1. Save the profile
2. Initialize the repository (if selected in Step 2)
3. Start the first backup immediately

You'll be redirected to the Dashboard where you can watch the backup progress in real time.

---

## Backup Profiles

A backup profile is a self-contained configuration that defines what to back up, where to store it, how often to run, and how long to keep snapshots. You can have as many profiles as you need — for example, one for documents, another for photos, and a third for a remote server.

### Creating a Profile Manually

Click **"New Profile"** on the Dashboard or the **"+"** button in the sidebar. This opens the profile editor with all fields empty.

### Execution Mode (Local vs Remote)

At the top of the profile editor, under **Execution Mode**, choose where restic runs:

- **This machine (local)** — restic runs on your computer. This is the default.
- **Remote server (SSH)** — restic runs on a remote server. Vaultik connects via SSH and executes restic commands there. See [Remote Backups via SSH](#remote-backups-via-ssh) for details.

When Remote is selected, additional fields appear:

| Field | Description |
|-------|------------|
| SSH Host | The server to connect to. Use `user@hostname` format, or a host alias from your `~/.ssh/config`. |
| SSH Port | Leave empty for the default (22). |
| Identity file | Path to your SSH private key. Leave empty to use ssh-agent or default keys. |
| Remote restic path | Path to the restic binary on the server. Leave empty if restic is on the server's PATH. |

Click **"Test SSH Connection"** to verify connectivity and that restic is available on the remote server.

### Repository Configuration

Under **Repository**, enter the URL for your storage backend. The format depends on the backend type. See [Supported Storage Backends](#supported-storage-backends) for all formats.

For new profiles, you also enter the **repository encryption password**. This password is stored securely in your OS keyring.

Buttons:
- **Test Connection** — verifies that Vaultik can access the repository with the given credentials.
- **Init New Repo** — creates a new restic repository at the given URL. Only needed for first-time setup.

### Backup Sources

Under **Backup Sources**, add the directories to include in backups. Type a path and press Enter or click **Add**. Remove entries by clicking **remove** next to them.

Each directory and all its contents are included in the backup. You can add multiple directories — they all go into the same snapshot.

### Exclusions

Under **Exclusions**, add glob patterns for files and directories to skip:

- `*.tmp` — skip all .tmp files
- `node_modules` — skip node_modules directories
- `.cache` — skip cache directories
- `*.log` — skip log files

Options:
- **Exclude cache directories (CACHEDIR.TAG)** — skips directories containing a CACHEDIR.TAG file. Many build tools and package managers mark their caches this way.
- **Stay on one filesystem** — prevents restic from crossing filesystem boundaries (e.g., not following into mounted drives).

### Retention Policies

Under **Retention Policy**, configure how many snapshots to keep across different time intervals:

| Field | Meaning |
|-------|---------|
| Keep Last | Always keep the N most recent snapshots |
| Keep Hourly | Keep one snapshot per hour for N hours |
| Keep Daily | Keep one snapshot per day for N days |
| Keep Weekly | Keep one snapshot per week for N weeks |
| Keep Monthly | Keep one snapshot per month for N months |
| Keep Yearly | Keep one snapshot per year for N years |

Leave a field empty to not apply that rule. When multiple rules overlap, snapshots are kept if they match **any** rule.

**Auto-prune after forget** — when enabled, restic reclaims disk space after removing old snapshots. Without this, removed snapshots are marked for deletion but storage is not freed until a separate prune operation.

### Scheduling

Under **Schedule**, toggle **"Enable automatic schedule"** to configure automated backups.

| Frequency | Behavior |
|-----------|----------|
| **Hourly** | Runs every hour at :00 |
| **Daily** | Runs once a day at the specified time |
| **Weekly** | Runs once a week on the specified day and time |
| **Custom** | Uses a systemd OnCalendar expression (e.g., `*-*-* 02:00:00`) |

Additional options:
- **Notify on success** — send a desktop notification when the backup completes successfully
- **Notify on failure** — send a desktop notification when the backup fails

Vaultik creates OS-native scheduled tasks:
- **Linux:** systemd user timers in `~/.config/systemd/user/`. Timers use `Persistent=true`, so missed backups run shortly after the computer starts.
- **macOS:** launchd user agents in `~/Library/LaunchAgents/`.
- **Windows:** Task Scheduler entries.

### Health Checks

Under **Health Checks**, enable **"Run repository check after each backup"** to verify repository integrity automatically.

Optionally set a **data subset** (e.g., `5%` or `1/10`) to check a random sample of data instead of reading everything. This is much faster for large repositories while still providing good coverage over time.

### Advanced Settings

Click **"Advanced Settings"** to expand additional options:

| Setting | Description |
|---------|------------|
| **Compression** | Auto (default), Off, Fastest, Better, or Maximum. Requires restic 0.14+. |
| **Upload limit** | Maximum upload speed in KiB/s. Useful for not saturating your connection. |
| **Download limit** | Maximum download speed in KiB/s. |
| **Read concurrency** | Number of parallel file reads. Higher values speed up backup at the cost of more I/O. |
| **Tags** | Comma-separated labels attached to every snapshot (e.g., "important, laptop"). |
| **Hostname override** | Custom hostname stored in snapshots. By default, restic uses the system hostname. |

### Editing an Existing Profile

Click a profile name on the Dashboard or in the sidebar to open the editor. Make changes and click **"Save Changes"**. Schedule changes are applied to the OS immediately.

From an existing profile, you can also:
- **Run Now** — start an immediate backup
- **Check Repo** — run a repository integrity check

### Deleting a Profile

Click **"Delete"** in the profile editor. A confirmation dialog appears. Deleting a profile:
- Removes the profile configuration
- Uninstalls any scheduled timer
- Removes the keyring password entry
- **Does NOT delete the restic repository or any backups.** Your data remains in the repository.

---

## Running Backups

### Manual Backup

Click **"Run Now"** on a profile card on the Dashboard, or in the profile editor. The backup starts immediately and progress appears on the Dashboard.

### Scheduled Backups

When a profile has a schedule configured, backups run automatically via the OS scheduler. You do not need to keep Vaultik open — the OS timer triggers the backup independently.

After a scheduled backup completes:
- The run is logged in [Run History](#run-history)
- A desktop notification is sent (if configured)
- The retention policy is applied automatically
- A health check runs (if configured)

### Pausing and Resuming

Click **"Pause"** on a profile card to temporarily disable its schedule. The profile card dims and shows a "paused" badge. The OS timer is uninstalled.

Click **"Resume"** to re-enable the schedule. The OS timer is reinstalled. All profile settings are preserved.

You can still run manual backups on a paused profile.

### Cancelling a Backup

While a backup is running, click **"Cancel"** in the progress panel on the Dashboard. The restic process is terminated and the run is logged as cancelled.

Cancelled backups do not create a snapshot. The repository is left in a consistent state.

---

## Browsing Snapshots

Navigate to the Snapshot Browser by clicking **"Snapshots"** on a profile card.

### Snapshot List

The left panel lists all snapshots for the profile, newest first. Each entry shows:

- **Snapshot ID** — the short identifier (accent-colored, monospace)
- **Timestamp** — when the backup was taken
- **Paths** — the directories that were backed up
- **Hostname** — the machine that created the snapshot
- **Summary** — file count and total size (e.g., "1,234 files . 4.2 GiB")

Click a snapshot to browse its contents in the file tree.

### File Tree Browser

The right panel shows the contents of the selected snapshot as a hierarchical file tree. Directories can be expanded and collapsed by clicking the arrow next to them.

Each row shows:
- **Checkbox** — select individual files or folders for restore
- **Name** — file or directory name
- **Type** — "dir", "file", or other
- **Size** — file size in human-readable format
- **Modified** — last modification date

### Deleting Snapshots

Click **"forget"** next to a snapshot in the list to remove it from the repository. The snapshot data is marked for deletion. If your profile has auto-prune enabled, disk space is reclaimed during the next backup's retention cleanup. Otherwise, run a manual prune via the restic CLI.

---

## Restoring Files

### Restore All Files

With a snapshot selected in the browser, click **"Restore All"** in the header. This restores the entire snapshot contents to a directory you specify.

### Selective Restore

Check the boxes next to specific files or directories in the file tree, then click **"Restore Selected"**. Only the checked items are restored.

This is useful for recovering a single file or directory without restoring everything.

### Restore Options

The restore dialog asks for:

| Option | Description |
|--------|------------|
| **Target directory** | Where to restore files. The original directory structure is recreated inside this path. |
| **Verify** | When checked, restic re-reads restored files and compares checksums against the repository to confirm integrity. Slower but provides certainty. |

### Monitoring Restore Progress

After clicking **"Start Restore"**, the dialog shows a live progress bar with:
- Percentage complete
- Files restored out of total
- Bytes restored out of total

You can cancel the restore at any time. When complete, a success or failure message appears.

---

## Run History

The **Run History** page (accessible from the sidebar) shows a chronological log of every operation — backups, restores, checks, and forgets.

### Filtering by Profile

Use the dropdown at the top to filter by a specific profile, or select **"All profiles"** to see everything.

### Understanding Run Details

Each entry shows a collapsed summary:

| Field | Description |
|-------|------------|
| **Status** | A colored badge: "success" (green), "partial" (yellow, completed with warnings), "failed" (red), or "running" (blue) |
| **Operation** | The type of operation: backup, restore, check, forget |
| **Profile** | Which profile ran the operation |
| **Trigger** | How it was started: "manual" or "scheduled" |
| **Duration** | How long the operation took |
| **Timestamp** | When the operation started |

Click an entry to expand it and see additional details:

- **Snapshot ID** — for backup operations, the ID of the created snapshot
- **Finished** — the completion timestamp
- **Summary grid** — files new, files changed, files unchanged, data added, duration, total files processed
- **Errors** — if any errors occurred, they are listed in a highlighted section

---

## Remote Backups via SSH

Vaultik can execute restic on a remote server over SSH. Instead of running restic locally, Vaultik opens an SSH connection and runs restic commands on the remote machine.

### When to Use Remote Execution

Remote execution is useful when:

- **The data lives on the server.** Backing up a remote server's files without first downloading them.
- **The repository is local to the server.** Restic can access the repository at full disk speed rather than over the network.
- **You manage multiple servers.** Control backups for several machines from a single Vaultik desktop.

### Setting Up SSH Access

Before configuring a remote profile, ensure:

1. **SSH key-based authentication is configured.** Vaultik uses `BatchMode=yes` and cannot prompt for SSH passwords. Set up SSH keys:
   ```bash
   ssh-keygen -t ed25519
   ssh-copy-id user@your-server
   ```

2. **Restic is installed on the remote server.** Verify:
   ```bash
   ssh user@your-server restic version
   ```

3. **The remote user has access** to the directories being backed up and the repository location.

Vaultik uses the system `ssh` binary, so it respects your `~/.ssh/config` file, SSH agent, ProxyJump, and all other SSH features.

### Configuring a Remote Profile

1. Create or edit a profile.
2. Under **Execution Mode**, select **"Remote server (SSH)"**.
3. Fill in the SSH connection details:
   - **SSH Host** — e.g., `user@192.168.1.10` or a host alias from `~/.ssh/config`
   - **SSH Port** — leave empty for the default (22)
   - **Identity file** — optional path to your SSH private key
   - **Remote restic path** — leave empty if restic is on the server's PATH
4. Configure the repository URL and sources **as they appear on the remote server** (e.g., `/srv/data` not a local path).

### Testing the Connection

Click **"Test SSH Connection"** to verify:
- SSH connectivity works
- Restic is found on the remote server
- The remote restic version is displayed on success

### How Remote Execution Works

When a remote profile runs a backup, Vaultik:
1. Opens an SSH connection to the configured host
2. Runs `restic backup --json ...` on the remote server
3. Streams the JSON output back over SSH
4. Parses it for real-time progress, just like a local backup

All operations — backup, restore, snapshots, check, forget — work identically whether the profile is local or remote.

The Dashboard shows a **"remote"** badge on remote profile cards.

> **Note on password security:** The repository password is passed to the remote restic process as an environment variable in the SSH command. It is visible in `ps` on the remote server for the duration of the operation. For environments where this is a concern, use a password file or password command on the remote server instead.

---

## Supported Storage Backends

Vaultik supports all restic storage backends. Enter the appropriate URL format in the repository field:

| Backend | URL Format | Example |
|---------|-----------|---------|
| **Local filesystem** | `/path/to/repo` | `/mnt/backup/restic-repo` |
| **USB drive** | `/media/usb/repo` | `/media/user/MyDrive/backups` |
| **SFTP** | `sftp:user@host:/path` | `sftp:admin@nas.local:/backup/laptop` |
| **Amazon S3** | `s3:s3.amazonaws.com/bucket` | `s3:s3.us-west-2.amazonaws.com/my-backups` |
| **MinIO** | `s3:http://host:9000/bucket` | `s3:http://minio.local:9000/backups` |
| **Backblaze B2** | `b2:bucket:path` | `b2:my-backup-bucket:laptop` |
| **Azure Blob** | `azure:container:path` | `azure:backups:/laptop` |
| **Google Cloud Storage** | `gs:bucket:/path` | `gs:my-gcs-bucket:/backups` |
| **OpenStack Swift** | `swift:container:/path` | `swift:backup-container:/laptop` |
| **rclone** | `rclone:remote:path` | `rclone:gdrive:backups/laptop` |
| **REST Server** | `rest:http://host:port/` | `rest:https://backup.example.com:8000/` |

For backends that require authentication (S3, B2, Azure, etc.), set credentials via environment variables as described in the [restic documentation](https://restic.readthedocs.io/en/latest/030_preparing_a_new_repo.html). You can pass backend-specific options via the `backend_options` field in the profile (accessible in the JSON profile file).

---

## Password Management

Every restic repository is encrypted with a password. Vaultik supports three ways to store and provide this password.

### OS Keyring (Recommended)

The default method. The password is stored in your operating system's secure credential storage:

| OS | Service |
|----|---------|
| Linux | libsecret (GNOME Keyring, KDE Wallet, or similar) |
| macOS | Keychain |
| Windows | Credential Manager |

The password is stored under the service name `vaultik` with the profile's UUID as the account name. It is encrypted by the OS and never written to disk as plaintext.

### Password File

Stores the password in a plaintext file at a path you specify. Restic reads the password from this file at runtime. This is useful for headless or automated setups.

Ensure the file has restrictive permissions:
```bash
chmod 600 /path/to/password-file
```

### Password Command

Runs a shell command and uses its stdout as the password. This integrates with external secret managers:

```bash
# Example: read from pass
pass show backup/restic-repo

# Example: read from HashiCorp Vault
vault kv get -field=password secret/restic
```

---

## Notifications

Vaultik sends desktop notifications after backup operations complete:

| Event | Notification |
|-------|-------------|
| **Success** | "Backup '[name]' completed — N new files, X added" |
| **Partial** | "Backup '[name]' completed with warnings — N errors occurred" |
| **Failure** | "Backup '[name]' failed — [error message]" |

Notifications are delivered via the OS notification system (freedesktop on Linux, Notification Center on macOS, Windows notifications).

You can control notifications per profile in the schedule settings:
- **Notify on success** — off by default
- **Notify on failure** — on by default

---

## Settings

Access Settings from the sidebar footer.

### Appearance

Toggle between **Light** and **Dark** themes. By default, Vaultik follows your operating system's appearance preference.

### Restic Binary

Vaultik shows the detected restic version. If restic is not on your PATH, or you want to use a specific version, enter a custom path (e.g., `/usr/local/bin/restic` or `C:\Tools\restic.exe`). Leave the field as `restic` to use the default PATH lookup.

### Export and Import Profiles

**Export** saves all your profile configurations to a JSON file. This is useful for backup, migration, or sharing configurations between machines. **Passwords are not included** in the export for security.

**Import** loads profiles from a previously exported file. Profiles with the same name as existing profiles are skipped to avoid duplicates. Imported profiles get new UUIDs and need their passwords set up again.

---

## Data Storage

Vaultik stores its data in standard OS locations:

| Data | Location | Format |
|------|----------|--------|
| Profile configuration | `~/.config/vaultik/profiles/` | JSON (one file per profile) |
| Run history | `~/.local/share/vaultik/history.db` | SQLite database |
| Passwords | OS keyring | Encrypted by the OS |
| Scheduled timers (Linux) | `~/.config/systemd/user/` | systemd unit files |
| Theme preference | Browser localStorage | Key: `vaultik-theme` |

None of this data leaves your machine. Uninstalling Vaultik does not delete your restic repositories or backup data.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Add a source path or exclusion pattern (in input fields) |
| `Tab` | Navigate between form fields |

---

## FAQ

### General

**Does Vaultik store or transmit my data?**

No. Vaultik is a local desktop app. There are no servers, no accounts, and no telemetry. It calls the `restic` binary on your machine. Your data goes directly from source to repository, encrypted by restic.

**Can I use Vaultik with an existing restic repository?**

Yes. Create a profile, enter the existing repository URL and password, and uncheck "Initialize as new repository." Vaultik will connect to your existing repository and work with all your existing snapshots.

**What happens if I uninstall Vaultik?**

Your restic repositories and all backup data remain untouched. Profile configurations are stored in `~/.config/vaultik/` and can be removed manually. You can always access your backups directly using the restic CLI.

**Can I use Vaultik and the restic CLI at the same time?**

Yes. Both tools work with the same repositories. Avoid running two operations on the same repository simultaneously — restic locks the repository and the second operation will fail with a "repository is locked" error.

**What restic versions are compatible?**

Vaultik works with any restic version that supports `--json` output. This includes restic 0.12 and later. For features like compression, restic 0.14+ is required.

### Backups

**How do I back up to a remote server?**

Two approaches:
1. **Remote repository** — restic runs locally, stores data remotely. Enter a remote repo URL (e.g., `sftp:user@host:/backup` or `s3:...`). Restic handles the network connection.
2. **Remote execution** — restic runs on the server via SSH. Set the execution mode to "Remote server (SSH)" in the profile. This avoids transferring source data over the network and is better when the data lives on the server.

**Can I back up multiple directories in one profile?**

Yes. Add each directory as a separate source. All sources are included in every snapshot.

**What does "exclude caches" do?**

It tells restic to skip directories containing a `CACHEDIR.TAG` file. Many tools (npm, pip, cargo, ccache) mark their caches this way. This saves significant space and time.

**Can I limit how much bandwidth backups use?**

Yes. In the profile editor under Advanced Settings, set upload and/or download limits in KiB/s. This prevents backups from saturating your network connection.

**What does "stay on one filesystem" do?**

When enabled, restic does not follow mount points. For example, if you back up `/home` and an external drive is mounted at `/home/user/media`, the external drive contents are skipped.

### Snapshots and Restoring

**How do I restore a single file?**

Open the Snapshot Browser, select a snapshot, navigate the file tree, check the file you want, and click "Restore Selected." Choose a target directory and Vaultik extracts only that file.

**What does "Verify" do during a restore?**

When enabled, restic re-reads the restored files and compares their checksums against the repository to confirm the data was written correctly. It's slower but guarantees integrity.

**Can I delete old snapshots?**

Yes. In the Snapshot Browser, click "forget" next to any snapshot. To automate cleanup, configure a retention policy in the profile — old snapshots are removed after each successful backup.

**Where are restored files placed?**

Restored files are placed inside the target directory you specify, with their original directory structure recreated. For example, if you restore `/home/user/Documents/report.pdf` to `/tmp/restore`, the file appears at `/tmp/restore/home/user/Documents/report.pdf`.

### Scheduling

**How does automatic scheduling work?**

Vaultik creates OS-native scheduled tasks. On Linux, it creates systemd user timer and service units. These run independently of Vaultik — you don't need to keep the app open.

**What happens if my computer is off at the scheduled time?**

On Linux with systemd, timers use `Persistent=true`, so the backup runs shortly after the computer starts. macOS and Windows have similar catch-up behavior.

**What does "Pause" do?**

Pausing uninstalls the OS timer so scheduled backups stop. The profile and all its settings are preserved. You can still run manual backups. Resuming reinstalls the timer.

### Remote SSH

**Why does "Test SSH Connection" fail?**

Common causes:
- SSH key-based auth is not configured. Vaultik cannot prompt for SSH passwords.
- The host is unreachable or the port is wrong.
- Restic is not installed on the remote server, or not on PATH. Set a custom remote restic path in the profile.
- If using a `~/.ssh/config` alias, make sure it resolves correctly.

**Can I use SSH config hosts, ProxyJump, and SSH agent?**

Yes. Vaultik uses the system `ssh` binary, so all SSH features work: config hosts, agent forwarding, ProxyJump, multiplexing, etc.

**Is it secure?**

The SSH connection itself is encrypted. The restic repository password is passed as an environment variable in the remote command, which means it is briefly visible in `ps` on the remote server. For high-security environments, use a password file or password command stored on the remote server.

### Passwords

**Where is my password stored?**

By default, in your OS keyring (libsecret on Linux, Keychain on macOS, Credential Manager on Windows). The keyring encrypts passwords at rest. They are never stored as plaintext on disk.

**What if I forget my repository password?**

**It cannot be recovered.** Restic uses strong encryption and there is no master key or reset mechanism. Store your password in a secure location outside of Vaultik (e.g., a password manager).

**Can I change the repository password?**

Yes, but this must be done via the restic CLI: `restic -r /path/to/repo key passwd`. Vaultik does not currently have a UI for key management. After changing the password, update it in the profile or re-create the keyring entry.

---

## Troubleshooting

**"restic not found"**

Install restic and ensure it is on your PATH. Run `restic version` in a terminal to verify. If restic is in a non-standard location, set the custom path in Settings.

**"repository is locked"**

Another restic process is running against the same repository. Wait for it to finish. If you're certain no process is active (e.g., after a crash), unlock manually:
```bash
restic -r /path/to/repo unlock
```

**Password errors despite correct password**

Passwords are stored in the OS keyring under the service "vaultik." If the keyring entry was deleted, the keyring daemon is not running, or you switched desktop environments, the password cannot be retrieved. Re-create the profile or add the password to the keyring manually.

**Scheduled backups not running (Linux)**

Check that the systemd timer is active:
```bash
systemctl --user list-timers | grep vaultik
```

View logs for the service:
```bash
journalctl --user -u vaultik-PROFILE_ID
```

Ensure the profile is not paused (check for a "paused" badge on the Dashboard).

**Scheduled backups not running (macOS / Windows)**

macOS launchd and Windows Task Scheduler integration is planned but not yet implemented in v0.1.0. Use an external scheduler (e.g., cron) to call `vaultik run PROFILE_ID` in the meantime.

**Backup is slow**

- Check your network speed to the repository (for remote backends).
- Increase **read concurrency** in Advanced Settings for faster local file reading.
- Ensure you're excluding large unnecessary directories (node_modules, build outputs, caches).
- The first backup is always the slowest. Subsequent backups are incremental and much faster.

**How to see debug logs**

Set environment variables before launching:
```bash
RUST_LOG=debug vaultik
```

Or write logs to a file:
```bash
RUST_LOG=debug vaultik 2>/tmp/vaultik-debug.log
```
