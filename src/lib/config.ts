// ── App Branding & Links ─────────────────────────────────────────
// Edit this file to change all names, links, and versions across the app.

export const APP = {
  name: "Vaultik",
  version: "0.1.0",
  tagline: "Encrypted backups, beautifully simple.",
  description:
    "A modern desktop interface for restic backup. Your data is encrypted before it leaves your machine.",
  techStack: "Built with Tauri, Rust, and React.",
} as const;

export const DEVELOPER = {
  name: "Kinan Ahmed",
  role: "Software Developer",
  initial: "K",
  bio: "Building tools to make encrypted backups accessible to everyone. Vaultik is crafted with care to be the reliable backup companion you can set and forget.",
  website: "https://swovo.de",
  websiteLabel: "swovo.de",
  github: "https://github.com/kinan9011/Vaultik",
  githubLabel: "GitHub",
} as const;

export const LINKS = {
  // Support
  buyMeACoffee: "https://buymeacoffee.com/swovo",
  kofi: "https://ko-fi.com/swovo",
  patreon: "https://patreon.com/Swovo",
  github: "https://github.com/kinan9011/Vaultik",
  githubIssues: "https://github.com/kinan9011/Vaultik/issues",
  githubWiki: "https://github.com/kinan9011/Vaultik/wiki",

  // Documentation
  resticDocs: "https://swovo.de/vaultik#help",
  resticForum: "",

  // Legal
  license: "https://github.com/kinan9011/Vaultik/blob/main/LICENSE",
} as const;

export const LICENSE = {
  name: "GNU Affero General Public License v3.0",
  copyright: `Copyright \u00A9 ${new Date().getFullYear()} ${DEVELOPER.name}. All rights reserved.`,
  summary: [
    "Vaultik is open source software licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). You are free to use, modify, and distribute this software.",
    "If you distribute modified versions of the software, or run it as a network service for users, you must make the corresponding source code available under the same AGPL-3.0 license.",
    "This software is provided without warranty. See the AGPL-3.0 license text for full terms and conditions.",
  ],
} as const;
