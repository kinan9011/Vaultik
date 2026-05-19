# Vaultik

## Core Value
Vaultik is a modern desktop GUI for `restic` backup, making secure, fast, and efficient backups accessible through an intuitive interface without requiring command-line expertise.

## Current Focus
The application has completed its UI prototype and initial functional implementation. The design mockups are ported to the frontend and wired to the Tauri (Rust) backend. We are now in a maintenance and feature-iteration state, focusing on reliability, advanced restic features, edge cases, and user experience polish.

## Tech Stack
- Frontend: React 19, TypeScript, Tailwind CSS v4, Zustand
- Backend: Tauri v2, Rust
- Core CLI: restic

## Constraints & Assumptions
- Restic executable must be available or bundled.
- All backend heavy-lifting is done in Rust to keep the UI thread responsive.
- Desktop-first design.
