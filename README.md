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

<a href="https://buymeacoffee.com/kinandev"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee"></a>
<a href="https://ko-fi.com/kinandev"><img src="https://img.shields.io/badge/Ko--fi-13C3FF?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
<a href="https://patreon.com/kinandev"><img src="https://img.shields.io/badge/Patreon-FF424D?style=for-the-badge&logo=patreon&logoColor=white" alt="Patreon"></a>

Patreon supporters can request individual features and vote on the roadmap.
