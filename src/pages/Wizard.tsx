import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProfile, initRepo, runBackup } from "@/lib/tauri";
import type { BackupProfile, Schedule } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

type Step = "sources" | "repo" | "password" | "schedule" | "retention" | "review";

const STEPS: Step[] = ["sources", "repo", "password", "schedule", "retention", "review"];

const RETENTION_PRESETS = {
  conservative: { keep_last: 7, keep_hourly: null, keep_daily: 7, keep_weekly: 4, keep_monthly: 12, keep_yearly: 3 },
  moderate: { keep_last: 5, keep_hourly: null, keep_daily: 3, keep_weekly: 4, keep_monthly: 6, keep_yearly: null },
  minimal: { keep_last: 3, keep_hourly: null, keep_daily: 7, keep_weekly: 4, keep_monthly: null, keep_yearly: null },
};

export default function Wizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("sources");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // State
  const [name, setName] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoType, setRepoType] = useState("local");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [initNewRepo, setInitNewRepo] = useState(true);
  const [enableSchedule, setEnableSchedule] = useState(true);
  const [scheduleKind, setScheduleKind] = useState<"Daily" | "Weekly" | "Hourly">("Daily");
  const [scheduleTime, setScheduleTime] = useState("02:00");
  const [retentionPreset, setRetentionPreset] = useState<"conservative" | "moderate" | "minimal">("conservative");

  const currentIndex = STEPS.indexOf(step);

  function next() {
    // Validation
    if (step === "sources") {
      if (!name.trim()) { setError("Enter a profile name"); return; }
      if (sources.length === 0) { setError("Add at least one backup source"); return; }
    }
    if (step === "repo" && !repoUrl.trim()) { setError("Enter a repository URL"); return; }
    if (step === "password") {
      if (!password) { setError("Enter a password"); return; }
      if (password !== passwordConfirm) { setError("Passwords do not match"); return; }
    }
    setError(null);
    setStep(STEPS[currentIndex + 1]);
  }

  function back() {
    setError(null);
    setStep(STEPS[currentIndex - 1]);
  }

  function addSource() {
    if (newSource.trim() && !sources.includes(newSource.trim())) {
      setSources([...sources, newSource.trim()]);
      setNewSource("");
    }
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);

    const profileId = uuidv4();
    const retention = RETENTION_PRESETS[retentionPreset];
    const schedule: Schedule | null = enableSchedule
      ? {
          kind: scheduleKind,
          time: scheduleKind !== "Hourly" ? scheduleTime : null,
          day_of_week: null,
          cron_expr: null,
          retry_on_failure: true,
          notify_on_success: false,
          notify_on_failure: true,
        }
      : null;

    const profile: BackupProfile = {
      id: profileId,
      name,
      repo_url: repoUrl,
      password_storage: { type: "Keyring", service: "vaultik", account: profileId },
      backend_options: [],
      sources,
      excludes: ["*.tmp", ".cache", "__pycache__", "node_modules"],
      exclude_caches: true,
      exclude_if_present: [],
      exclude_larger_than: null,
      one_file_system: false,
      tags: [],
      host_override: null,
      retention: { ...retention, keep_within: null, keep_tags: [] },
      auto_prune: true,
      schedule,
      paused: false,
      check_after_backup: false,
      check_read_data_subset: null,
      compression: null,
      upload_limit_kib: null,
      download_limit_kib: null,
      read_concurrency: null,
    };

    try {
      // Init repo if requested
      if (initNewRepo) {
        await initRepo(repoUrl, password);
      }

      // Create the profile
      await createProfile(profile, password);

      // Start first backup
      await runBackup(profileId);

      navigate("/");
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= currentIndex ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="mb-8">
          {step === "sources" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">What do you want to back up?</h2>
              <p className="text-sm text-text-secondary">
                Give your backup a name and choose the directories to protect.
              </p>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Profile name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Laptop, Work Projects"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-2">
                {sources.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-lg text-sm">
                    <span className="flex-1 font-mono text-xs truncate">{s}</span>
                    <button
                      onClick={() => setSources(sources.filter((_, j) => j !== i))}
                      className="text-text-muted hover:text-error text-xs"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSource()}
                  placeholder="/home/user/Documents"
                  className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                />
                <button
                  onClick={addSource}
                  className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {step === "repo" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Where should backups be stored?</h2>
              <p className="text-sm text-text-secondary">
                Choose a storage location. All data is encrypted before leaving your machine.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "local", label: "Local / USB" },
                  { key: "sftp", label: "SFTP Server" },
                  { key: "s3", label: "S3 / MinIO" },
                  { key: "b2", label: "Backblaze B2" },
                  { key: "rest", label: "REST Server" },
                  { key: "other", label: "Other" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setRepoType(key)}
                    className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                      repoType === key
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border hover:bg-bg-tertiary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Repository URL
                </label>
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder={
                    repoType === "local" ? "/mnt/backup/restic-repo" :
                    repoType === "sftp" ? "sftp:user@host:/backup/repo" :
                    repoType === "s3" ? "s3:s3.amazonaws.com/bucket-name" :
                    repoType === "b2" ? "b2:bucket-name:prefix" :
                    repoType === "rest" ? "rest:http://host:8000/" :
                    "backend:path"
                  }
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={initNewRepo}
                  onChange={(e) => setInitNewRepo(e.target.checked)}
                  className="rounded"
                />
                Initialize as new repository (uncheck if connecting to existing repo)
              </label>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Set encryption password</h2>
              <p className="text-sm text-text-secondary">
                This password encrypts all your backup data. Store it safely — without it, your backups cannot be recovered.
              </p>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Confirm password</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                />
              </div>
              <p className="text-xs text-text-muted">
                Password will be stored securely in your OS keyring.
              </p>
            </div>
          )}

          {step === "schedule" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">How often should backups run?</h2>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={enableSchedule}
                  onChange={(e) => setEnableSchedule(e.target.checked)}
                  className="rounded"
                />
                Enable automatic backups
              </label>
              {enableSchedule && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {(["Hourly", "Daily", "Weekly"] as const).map((kind) => (
                      <button
                        key={kind}
                        onClick={() => setScheduleKind(kind)}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          scheduleKind === kind
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border hover:bg-bg-tertiary"
                        }`}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                  {scheduleKind !== "Hourly" && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "retention" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">How many backups to keep?</h2>
              <p className="text-sm text-text-secondary">
                Old backups are automatically removed based on this policy.
              </p>
              <div className="space-y-2">
                {([
                  { key: "conservative", label: "Conservative", desc: "7 daily, 4 weekly, 12 monthly, 3 yearly" },
                  { key: "moderate", label: "Moderate", desc: "3 daily, 4 weekly, 6 monthly" },
                  { key: "minimal", label: "Minimal", desc: "7 daily, 4 weekly" },
                ] as const).map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setRetentionPreset(key)}
                    className={`w-full p-4 text-left rounded-lg border transition-colors ${
                      retentionPreset === key
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-bg-tertiary"
                    }`}
                  >
                    <p className={`text-sm font-medium ${retentionPreset === key ? "text-accent" : ""}`}>
                      {label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ready to go</h2>
              <p className="text-sm text-text-secondary">
                Review your setup and start your first backup.
              </p>
              <div className="space-y-3 p-4 bg-bg-tertiary rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Name</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Sources</span>
                  <span className="font-medium">{sources.length} directories</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Repository</span>
                  <span className="font-medium font-mono text-xs">{repoUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Schedule</span>
                  <span className="font-medium">
                    {enableSchedule ? `${scheduleKind} at ${scheduleTime}` : "Manual only"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Retention</span>
                  <span className="font-medium capitalize">{retentionPreset}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <div>
            {currentIndex > 0 && (
              <button
                onClick={back}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            {step === "review" ? (
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-6 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Creating..." : "Create & Run First Backup"}
              </button>
            ) : (
              <button
                onClick={next}
                className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
