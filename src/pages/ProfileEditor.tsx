import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  initRepo,
  testRepo,
  testSshConnection,
  setSchedule,
  removeSchedule,
  runBackup,
  runCheck,
} from "@/lib/tauri";
import type { BackupProfile, RemoteHost, RetentionPolicy, Schedule } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

function emptyProfile(): BackupProfile {
  return {
    id: uuidv4(),
    name: "",
    repo_url: "",
    password_storage: { type: "Keyring", service: "vaultik", account: "" },
    backend_options: [],
    sources: [],
    excludes: [],
    exclude_caches: true,
    exclude_if_present: [],
    exclude_larger_than: null,
    one_file_system: false,
    tags: [],
    host_override: null,
    retention: {
      keep_last: 7,
      keep_hourly: null,
      keep_daily: 7,
      keep_weekly: 4,
      keep_monthly: 12,
      keep_yearly: 3,
      keep_within: null,
      keep_tags: [],
    },
    auto_prune: false,
    schedule: null,
    paused: false,
    check_after_backup: false,
    check_read_data_subset: null,
    compression: null,
    upload_limit_kib: null,
    download_limit_kib: null,
    read_concurrency: null,
    remote_host: null,
  };
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))
        }
        min={-1}
        className="w-full px-2 py-1.5 bg-bg-tertiary border border-border rounded text-sm text-text focus:outline-none focus:border-accent"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">{title}</h3>
      {children}
    </section>
  );
}

// ── Schedule Editor ─────────────────────────────────────────────────────────

function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: Schedule | null;
  onChange: (s: Schedule | null) => void;
}) {
  const enabled = schedule !== null;

  function toggle() {
    if (enabled) {
      onChange(null);
    } else {
      onChange({
        kind: "Daily",
        time: "02:00",
        day_of_week: null,
        cron_expr: null,
        retry_on_failure: true,
        notify_on_success: false,
        notify_on_failure: true,
      });
    }
  }

  function update(patch: Partial<Schedule>) {
    if (schedule) onChange({ ...schedule, ...patch });
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" checked={enabled} onChange={toggle} className="rounded" />
        Enable automatic schedule
      </label>

      {schedule && (
        <div className="space-y-3 pl-6">
          <Select
            label="Frequency"
            value={schedule.kind}
            onChange={(v) =>
              update({
                kind: v as Schedule["kind"],
                time: v === "Hourly" ? null : schedule.time || "02:00",
                day_of_week: v === "Weekly" ? "Mon" : null,
                cron_expr: v === "Custom" ? "0 2 * * *" : null,
              })
            }
            options={[
              { value: "Hourly", label: "Every hour" },
              { value: "Daily", label: "Daily" },
              { value: "Weekly", label: "Weekly" },
              { value: "Custom", label: "Custom (cron)" },
            ]}
          />

          {(schedule.kind === "Daily" || schedule.kind === "Weekly") && (
            <Input
              label="Time"
              value={schedule.time || "02:00"}
              onChange={(v) => update({ time: v })}
              placeholder="HH:MM"
            />
          )}

          {schedule.kind === "Weekly" && (
            <Select
              label="Day of week"
              value={schedule.day_of_week || "Mon"}
              onChange={(v) => update({ day_of_week: v })}
              options={[
                { value: "Mon", label: "Monday" },
                { value: "Tue", label: "Tuesday" },
                { value: "Wed", label: "Wednesday" },
                { value: "Thu", label: "Thursday" },
                { value: "Fri", label: "Friday" },
                { value: "Sat", label: "Saturday" },
                { value: "Sun", label: "Sunday" },
              ]}
            />
          )}

          {schedule.kind === "Custom" && (
            <Input
              label="Cron expression (systemd OnCalendar format)"
              value={schedule.cron_expr || ""}
              onChange={(v) => update({ cron_expr: v })}
              placeholder="*-*-* 02:00:00"
            />
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={schedule.notify_on_success}
                onChange={(e) => update({ notify_on_success: e.target.checked })}
                className="rounded"
              />
              Notify on success
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={schedule.notify_on_failure}
                onChange={(e) => update({ notify_on_failure: e.target.checked })}
                className="rounded"
              />
              Notify on failure
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Editor ─────────────────────────────────────────────────────────────

export default function ProfileEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [profile, setProfile] = useState<BackupProfile>(emptyProfile);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "loading";
    message: string;
  } | null>(null);
  const [newSource, setNewSource] = useState("");
  const [newExclude, setNewExclude] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      getProfile(id)
        .then(setProfile)
        .catch((e) => setStatus({ type: "error", message: String(e) }));
    }
  }, [id, isNew]);

  function update(patch: Partial<BackupProfile>) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  function updateRetention(patch: Partial<RetentionPolicy>) {
    setProfile((p) => ({ ...p, retention: { ...p.retention, ...patch } }));
  }

  async function handleSave() {
    if (!profile.name.trim()) {
      setStatus({ type: "error", message: "Profile name is required" });
      return;
    }
    if (!profile.repo_url.trim()) {
      setStatus({ type: "error", message: "Repository URL is required" });
      return;
    }
    setStatus({ type: "loading", message: "Saving..." });
    try {
      if (isNew) {
        const newProfile = {
          ...profile,
          password_storage: {
            type: "Keyring" as const,
            service: "vaultik",
            account: profile.id,
          },
        };
        await createProfile(newProfile, password || undefined);
      } else {
        await updateProfile(profile);
        // If schedule changed, update the OS scheduler
        if (profile.schedule) {
          await setSchedule(profile.id, profile.schedule);
        } else {
          await removeSchedule(profile.id).catch(() => {});
        }
      }
      setStatus({ type: "success", message: "Profile saved" });
      if (isNew) {
        navigate(`/profiles/${profile.id}`, { replace: true });
      }
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }

  async function handleTestConnection() {
    setStatus({ type: "loading", message: "Testing connection..." });
    try {
      await testRepo(profile);
      setStatus({ type: "success", message: "Connection successful" });
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }

  async function handleInitRepo() {
    if (!password) {
      setStatus({ type: "error", message: "Password required to initialize repository" });
      return;
    }
    setStatus({ type: "loading", message: "Initializing repository..." });
    try {
      await initRepo(profile.repo_url, password);
      setStatus({ type: "success", message: "Repository initialized" });
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this profile? This cannot be undone.")) return;
    try {
      await deleteProfile(profile.id);
      navigate("/");
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }

  async function handleRunNow() {
    setStatus({ type: "loading", message: "Starting backup..." });
    try {
      await runBackup(profile.id);
      setStatus({ type: "success", message: "Backup started — see Dashboard for progress" });
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }

  async function handleTestSsh() {
    if (!profile.remote_host?.host) {
      setStatus({ type: "error", message: "SSH host is required" });
      return;
    }
    setStatus({ type: "loading", message: "Testing SSH connection..." });
    try {
      const version = await testSshConnection(
        profile.remote_host.host,
        profile.remote_host.port ?? undefined,
        profile.remote_host.identity_file ?? undefined,
        profile.remote_host.remote_restic_path ?? undefined,
      );
      setStatus({ type: "success", message: `SSH OK: ${version}` });
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }

  function updateRemoteHost(patch: Partial<RemoteHost>) {
    setProfile((p) => ({
      ...p,
      remote_host: p.remote_host ? { ...p.remote_host, ...patch } : null,
    }));
  }

  async function handleRunCheck() {
    setStatus({ type: "loading", message: "Running repository check..." });
    try {
      await runCheck(profile.id, profile.check_read_data_subset ?? undefined);
      setStatus({ type: "success", message: "Repository check passed" });
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }

  function addSource() {
    if (newSource.trim()) {
      update({ sources: [...profile.sources, newSource.trim()] });
      setNewSource("");
    }
  }

  function removeSource(index: number) {
    update({ sources: profile.sources.filter((_, i) => i !== index) });
  }

  function addExclude() {
    if (newExclude.trim()) {
      update({ excludes: [...profile.excludes, newExclude.trim()] });
      setNewExclude("");
    }
  }

  function removeExclude(index: number) {
    update({ excludes: profile.excludes.filter((_, i) => i !== index) });
  }

  return (
    <div className="p-8 max-w-3xl overflow-auto h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">
          {isNew ? "New Profile" : profile.name || "Edit Profile"}
        </h2>
        <div className="flex gap-2">
          {!isNew && (
            <>
              <button
                onClick={handleRunNow}
                className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
              >
                Run Now
              </button>
              <button
                onClick={handleRunCheck}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Check Repo
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm text-error border border-error/30 rounded-lg hover:bg-error/10 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {status && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm ${
            status.type === "success"
              ? "bg-success/10 border border-success/30 text-success"
              : status.type === "error"
                ? "bg-error/10 border border-error/30 text-error"
                : "bg-accent/10 border border-accent/30 text-accent"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="space-y-8">
        {/* General */}
        <Section title="General">
          <Input
            label="Profile Name"
            value={profile.name}
            onChange={(v) => update({ name: v })}
            placeholder="e.g. Laptop Daily"
          />
        </Section>

        {/* Execution Mode */}
        <Section title="Execution Mode">
          <Select
            label="Run restic on"
            value={profile.remote_host ? "remote" : "local"}
            onChange={(v) => {
              if (v === "local") {
                update({ remote_host: null });
              } else {
                update({
                  remote_host: {
                    host: "",
                    port: null,
                    identity_file: null,
                    remote_restic_path: null,
                  },
                });
              }
            }}
            options={[
              { value: "local", label: "This machine (local)" },
              { value: "remote", label: "Remote server (SSH)" },
            ]}
          />

          {profile.remote_host && (
            <div className="space-y-3 pl-4 border-l-2 border-border mt-3">
              <Input
                label="SSH Host"
                value={profile.remote_host.host}
                onChange={(v) => updateRemoteHost({ host: v })}
                placeholder="user@hostname or hostname"
              />
              <NumberInput
                label="SSH Port (leave empty for 22)"
                value={profile.remote_host.port}
                onChange={(v) => updateRemoteHost({ port: v })}
              />
              <Input
                label="Identity file (optional)"
                value={profile.remote_host.identity_file || ""}
                onChange={(v) => updateRemoteHost({ identity_file: v || null })}
                placeholder="~/.ssh/id_ed25519"
              />
              <Input
                label="Remote restic path (optional)"
                value={profile.remote_host.remote_restic_path || ""}
                onChange={(v) => updateRemoteHost({ remote_restic_path: v || null })}
                placeholder="restic (default: on PATH)"
              />
              <button
                onClick={handleTestSsh}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Test SSH Connection
              </button>
            </div>
          )}
        </Section>

        {/* Repository */}
        <Section title="Repository">
          <Input
            label="Repository URL"
            value={profile.repo_url}
            onChange={(v) => update({ repo_url: v })}
            placeholder="/mnt/backup, s3:s3.amazonaws.com/bucket, sftp:user@host:/path"
          />
          {isNew && (
            <Input
              label="Repository Password"
              value={password}
              onChange={setPassword}
              placeholder="Encryption password"
              type="password"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              Test Connection
            </button>
            {isNew && (
              <button
                onClick={handleInitRepo}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Init New Repo
              </button>
            )}
          </div>
        </Section>

        {/* Sources */}
        <Section title="Backup Sources">
          <div className="space-y-2">
            {profile.sources.map((src, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-lg text-sm">
                <span className="flex-1 truncate font-mono text-xs">{src}</span>
                <button onClick={() => removeSource(i)} className="text-text-muted hover:text-error text-xs">
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
              placeholder="/path/to/directory"
              className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
            />
            <button onClick={addSource} className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">
              Add
            </button>
          </div>
        </Section>

        {/* Excludes */}
        <Section title="Exclusions">
          <div className="space-y-2">
            {profile.excludes.map((exc, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-lg text-sm">
                <span className="flex-1 font-mono text-xs">{exc}</span>
                <button onClick={() => removeExclude(i)} className="text-text-muted hover:text-error text-xs">
                  remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newExclude}
              onChange={(e) => setNewExclude(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExclude()}
              placeholder="*.tmp, node_modules, .cache"
              className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
            />
            <button onClick={addExclude} className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">
              Add
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={profile.exclude_caches} onChange={(e) => update({ exclude_caches: e.target.checked })} className="rounded" />
            Exclude cache directories (CACHEDIR.TAG)
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={profile.one_file_system} onChange={(e) => update({ one_file_system: e.target.checked })} className="rounded" />
            Stay on one filesystem
          </label>
        </Section>

        {/* Retention */}
        <Section title="Retention Policy">
          <div className="grid grid-cols-3 gap-3">
            <NumberInput label="Keep Last" value={profile.retention.keep_last} onChange={(v) => updateRetention({ keep_last: v })} />
            <NumberInput label="Keep Hourly" value={profile.retention.keep_hourly} onChange={(v) => updateRetention({ keep_hourly: v })} />
            <NumberInput label="Keep Daily" value={profile.retention.keep_daily} onChange={(v) => updateRetention({ keep_daily: v })} />
            <NumberInput label="Keep Weekly" value={profile.retention.keep_weekly} onChange={(v) => updateRetention({ keep_weekly: v })} />
            <NumberInput label="Keep Monthly" value={profile.retention.keep_monthly} onChange={(v) => updateRetention({ keep_monthly: v })} />
            <NumberInput label="Keep Yearly" value={profile.retention.keep_yearly} onChange={(v) => updateRetention({ keep_yearly: v })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={profile.auto_prune} onChange={(e) => update({ auto_prune: e.target.checked })} className="rounded" />
            Auto-prune after forget
          </label>
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <ScheduleEditor
            schedule={profile.schedule}
            onChange={(s) => update({ schedule: s })}
          />
        </Section>

        {/* Health Checks */}
        <Section title="Health Checks">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={profile.check_after_backup}
              onChange={(e) => update({ check_after_backup: e.target.checked })}
              className="rounded"
            />
            Run repository check after each backup
          </label>
          {profile.check_after_backup && (
            <Input
              label="Check data subset (optional)"
              value={profile.check_read_data_subset || ""}
              onChange={(v) => update({ check_read_data_subset: v || null })}
              placeholder='e.g. "5%" or "1/10"'
            />
          )}
        </Section>

        {/* Advanced */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            {showAdvanced ? "\u25BE" : "\u25B8"} Advanced Settings
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-border">
              <Select
                label="Compression"
                value={profile.compression || "auto"}
                onChange={(v) => update({ compression: v === "auto" ? null : v })}
                options={[
                  { value: "auto", label: "Auto (default)" },
                  { value: "off", label: "Off" },
                  { value: "fastest", label: "Fastest" },
                  { value: "better", label: "Better" },
                  { value: "max", label: "Maximum" },
                ]}
              />
              <NumberInput
                label="Upload limit (KiB/s)"
                value={profile.upload_limit_kib}
                onChange={(v) => update({ upload_limit_kib: v })}
              />
              <NumberInput
                label="Download limit (KiB/s)"
                value={profile.download_limit_kib}
                onChange={(v) => update({ download_limit_kib: v })}
              />
              <NumberInput
                label="Read concurrency"
                value={profile.read_concurrency}
                onChange={(v) => update({ read_concurrency: v })}
              />
              <Input
                label="Tags (comma-separated)"
                value={profile.tags.join(", ")}
                onChange={(v) =>
                  update({
                    tags: v
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="important, laptop"
              />
              <Input
                label="Hostname override"
                value={profile.host_override || ""}
                onChange={(v) => update({ host_override: v || null })}
                placeholder="Leave empty to use system hostname"
              />
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isNew ? "Create Profile" : "Save Changes"}
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-bg-tertiary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
