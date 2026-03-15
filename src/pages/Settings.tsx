import { useEffect, useState } from "react";
import { getResticVersion, exportProfiles, importProfiles } from "@/lib/tauri";
import type { ImportResult } from "@/lib/tauri";
import { open } from "@tauri-apps/plugin-shell";
import { save, open as openDialog } from "@tauri-apps/plugin-dialog";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { APP, DEVELOPER, LINKS, LICENSE } from "@/lib/config";

function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={() => open(href)}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

export default function Settings() {
  const [resticVersion, setResticVersion] = useState<string>("");
  const [resticPath, setResticPath] = useState<string>("restic");
  const { theme, setTheme } = useTheme();
  const [dataStatus, setDataStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  useEffect(() => {
    getResticVersion()
      .then(setResticVersion)
      .catch(() => setResticVersion("Not found"));
  }, []);

  async function handleExport() {
    try {
      const path = await save({
        title: "Export Profiles",
        defaultPath: "vaultik-profiles.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return;
      const count = await exportProfiles([], path);
      setDataStatus({
        type: "success",
        message: `Exported ${count} profile${count !== 1 ? "s" : ""} successfully.`,
      });
    } catch (e) {
      setDataStatus({ type: "error", message: String(e) });
    }
  }

  async function handleImport() {
    try {
      const path = await openDialog({
        title: "Import Profiles",
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return;
      const result: ImportResult = await importProfiles(path);
      if (result.imported === 0 && result.skipped > 0) {
        setDataStatus({
          type: "error",
          message: `No new profiles imported. ${result.skipped} skipped (names already exist).`,
        });
      } else {
        const parts: string[] = [];
        parts.push(`Imported ${result.imported} profile${result.imported !== 1 ? "s" : ""}`);
        if (result.skipped > 0) parts.push(`${result.skipped} skipped (duplicate names)`);
        setDataStatus({ type: "success", message: parts.join(". ") + "." });
      }
    } catch (e) {
      setDataStatus({ type: "error", message: String(e) });
    }
  }

  return (
    <div className="p-8 max-w-3xl overflow-auto h-full">
      <h2 className="text-2xl font-semibold mb-8">Settings</h2>

      <div className="space-y-8">
        {/* Appearance */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Appearance
          </h3>
          <div className="flex items-center justify-between p-4 bg-bg-secondary border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-text-muted mt-0.5">
                Choose your preferred appearance
              </p>
            </div>
            <div className="flex bg-bg-tertiary rounded-lg p-0.5">
              {(["light", "dark"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${
                    theme === t
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:text-text"
                  }`}
                >
                  {t === "light" ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Light
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Dark
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Restic Binary */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Restic Binary
          </h3>
          <div className="p-4 bg-bg-secondary border border-border rounded-lg">
            <p className="text-sm font-medium">Version</p>
            <p className="text-xs text-text-muted mt-1">
              {resticVersion || "Detecting..."}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Custom restic path (optional)
            </label>
            <input
              type="text"
              value={resticPath}
              onChange={(e) => setResticPath(e.target.value)}
              placeholder="restic"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-text-muted mt-1">
              Leave as "restic" to use the binary from your PATH.
            </p>
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Data Management
          </h3>
          <div className="p-4 bg-bg-secondary border border-border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Export Profiles</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Save all profiles to a JSON file. Passwords are not included.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
              >
                Export
              </button>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Import Profiles</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Load profiles from a previously exported file. Duplicates are skipped.
                </p>
              </div>
              <button
                onClick={handleImport}
                className="px-4 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
              >
                Import
              </button>
            </div>
            {dataStatus.type !== "idle" && (
              <div
                className={`text-xs px-3 py-2 rounded-lg ${
                  dataStatus.type === "success"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {dataStatus.message}
              </div>
            )}
          </div>
        </section>

        {/* Help & Documentation */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Help & Documentation
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <ExternalLink
              href={LINKS.resticDocs}
              className="p-4 bg-bg-secondary border border-border rounded-lg hover:border-accent/40 transition-colors text-left"
            >
              <p className="text-sm font-medium">Restic Documentation</p>
              <p className="text-xs text-text-muted mt-1">
                Official restic docs, commands, and guides
              </p>
            </ExternalLink>
            <ExternalLink
              href={LINKS.githubWiki}
              className="p-4 bg-bg-secondary border border-border rounded-lg hover:border-accent/40 transition-colors text-left"
            >
              <p className="text-sm font-medium">GUI Documentation</p>
              <p className="text-xs text-text-muted mt-1">
                Setup guides, FAQ, and troubleshooting
              </p>
            </ExternalLink>
            <ExternalLink
              href={LINKS.githubIssues}
              className="p-4 bg-bg-secondary border border-border rounded-lg hover:border-accent/40 transition-colors text-left"
            >
              <p className="text-sm font-medium">Report a Bug</p>
              <p className="text-xs text-text-muted mt-1">
                Found an issue? Let us know on GitHub
              </p>
            </ExternalLink>
            <ExternalLink
              href={LINKS.resticForum}
              className="p-4 bg-bg-secondary border border-border rounded-lg hover:border-accent/40 transition-colors text-left"
            >
              <p className="text-sm font-medium">Community Forum</p>
              <p className="text-xs text-text-muted mt-1">
                Ask questions and share tips
              </p>
            </ExternalLink>
          </div>
        </section>

        {/* Support the Developer */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Support the Developer
          </h3>
          <p className="text-sm text-text-secondary">
            {APP.name} is free and open source. If you find it useful, consider supporting
            development to keep it going.
          </p>
          <div className="flex flex-wrap gap-3">
            <ExternalLink
              href={LINKS.buyMeACoffee}
              className="flex items-center gap-2.5 px-5 py-3 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-[#000000] rounded-lg text-sm font-semibold transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.062 2.014.13l.04.005c.332.046.397.482.294.776-.057.163-.048.305-.048.469v.018c0 .138-.006.276-.012.413-.012.243-.037.486-.073.727a11.89 11.89 0 01-.083.455c-.01.044-.022.088-.034.13a.942.942 0 01-.065.2c-.074.176-.205.306-.39.362a1.108 1.108 0 01-.39.048c-.18-.005-.36-.023-.537-.053a10.073 10.073 0 01-1.038-.228 10.42 10.42 0 01-.976-.345 9.476 9.476 0 01-.915-.436c-.31-.183-.607-.39-.885-.618a4.984 4.984 0 01-.262-.274c-.09-.101-.125-.238-.09-.363.106-.387.465-.507.814-.36.275.114.523.27.76.44.474.337.917.725 1.417 1.015.244.143.5.27.764.377.264.108.533.2.808.272.137.035.278.065.42.088l.11.016c.068.008.137.015.206.019h.012c.153.007.306.003.459-.012.055-.006.109-.014.163-.024.137-.023.205-.2.146-.324-.064-.131-.2-.189-.34-.168" />
              </svg>
              Buy Me a Coffee
            </ExternalLink>
            <ExternalLink
              href={LINKS.kofi}
              className="flex items-center gap-2.5 px-5 py-3 bg-[#13C3FF] hover:bg-[#13C3FF]/90 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
              </svg>
              Ko-fi
            </ExternalLink>
            <ExternalLink
              href={LINKS.patreon}
              className="flex items-center gap-2.5 px-5 py-3 bg-[#FF424D] hover:bg-[#FF424D]/90 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
              </svg>
              Patreon
            </ExternalLink>
          </div>
          <p className="text-xs text-text-muted">
            Patreon supporters can request individual features and vote on the roadmap.
          </p>
          <ExternalLink
            href={LINKS.github}
            className="flex items-center gap-2.5 px-4 py-2.5 border border-border rounded-lg hover:bg-bg-tertiary transition-colors text-left w-full"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <div>
              <p className="text-sm font-medium">Star on GitHub</p>
              <p className="text-xs text-text-muted">Open source and free forever</p>
            </div>
          </ExternalLink>
        </section>

        {/* Developer */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Developer
          </h3>
          <div className="p-5 bg-bg-secondary border border-border rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent text-lg font-bold flex-shrink-0">
                {DEVELOPER.initial}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{DEVELOPER.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{DEVELOPER.role}</p>
                <p className="text-xs text-text-secondary mt-2">{DEVELOPER.bio}</p>
                <div className="flex gap-3 mt-3">
                  <ExternalLink
                    href={DEVELOPER.website}
                    className="text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    {DEVELOPER.websiteLabel}
                  </ExternalLink>
                  <ExternalLink
                    href={DEVELOPER.github}
                    className="text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    {DEVELOPER.githubLabel}
                  </ExternalLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* License */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            License
          </h3>
          <div className="p-5 bg-bg-secondary border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{LICENSE.name}</p>
              <ExternalLink
                href={LINKS.license}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                View full license
              </ExternalLink>
            </div>
            <div className="text-xs text-text-secondary space-y-2">
              <p>{LICENSE.copyright}</p>
              {LICENSE.summary.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            About
          </h3>
          <div className="p-4 bg-bg-secondary border border-border rounded-lg">
            <p className="text-sm font-medium">{APP.name} GUI</p>
            <p className="text-xs text-text-muted mt-1">Version {APP.version}</p>
            <p className="text-xs text-text-muted mt-2">{APP.description}</p>
            <p className="text-xs text-text-muted mt-2">{APP.techStack}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
