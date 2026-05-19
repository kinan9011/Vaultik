import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { createProfile, initRepo } from "../lib/tauri";
import { BackupProfile } from "../lib/types";
import { v4 as uuidv4 } from 'uuid';
import {
  IconShield,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconFolder,
  IconHdd,
  IconCloud,
  IconServer,
  IconKey,
  IconClock,
} from "../components/Icons";

const STEPS = [
  { n: 1, label: "Sources" },
  { n: 2, label: "Storage" },
  { n: 3, label: "Security" },
  { n: 4, label: "Schedule" },
  { n: 5, label: "Retention" },
  { n: 6, label: "Review" },
];

const Steps = ({ current }: { current: number }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
    {STEPS.map((s, i) => {
      const done = s.n < current;
      const active = s.n === current;
      return (
        <React.Fragment key={s.n}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 100,
              background: active ? "var(--accent-soft)" : "transparent",
              color: active
                ? "var(--accent)"
                : done
                ? "var(--text-2)"
                : "var(--text-4)",
              border: active
                ? "1px solid var(--accent-line)"
                : "1px solid transparent",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: done
                  ? "var(--accent)"
                  : active
                  ? "transparent"
                  : "var(--surface-2)",
                border: active ? "1.5px solid var(--accent)" : "none",
                color: done ? "#04221a" : "currentColor",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {done ? <IconCheck size={10} /> : s.n}
            </span>
            <span>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <span
              style={{
                width: 12,
                height: 1,
                background: s.n < current ? "var(--accent)" : "var(--border)",
                opacity: 0.6,
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const WizardFrame = ({
  current,
  children,
  primaryLabel = "Continue",
  primaryIcon = IconArrowRight,
  title,
  sub,
  onNext,
  onBack,
  loading = false,
}: {
  current: number;
  children: React.ReactNode;
  primaryLabel?: string;
  primaryIcon?: React.ElementType;
  title: string;
  sub: string;
  onNext?: () => void;
  onBack?: () => void;
  loading?: boolean;
}) => (
  <>
    <div
      style={{
        padding: "10px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          className="btn btn-icon"
          style={{ width: 26, height: 26 }}
          onClick={onBack}
        >
          <IconArrowLeft size={13} />
        </button>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>
          Setup wizard
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <Steps current={current} />
      </div>

      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-4)",
        }}
      >
        Step {current}/6
      </span>
    </div>

    <div
      className="v-body"
      style={{ display: "grid", placeItems: "start center" }}
    >
      <div style={{ maxWidth: 640, width: "100%", padding: "12px 0 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 6px",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: "var(--text-3)",
              fontSize: 13.5,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {sub}
          </p>
        </div>

        {children}

        <div
          style={{
            marginTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 18,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button className="btn" onClick={onBack} disabled={loading}>
            <IconArrowLeft size={12} /> Back
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" disabled={loading}>Cancel</button>
            <button className="btn btn-primary btn-lg" onClick={onNext} disabled={loading}>
              {loading ? "Working..." : primaryLabel} {!loading && React.createElement(primaryIcon, { size: 13 })}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);

const BACKENDS = [
  {
    key: "local",
    icon: IconHdd,
    label: "Local / USB drive",
    url: "/mnt/backup/repo",
    desc: "Fastest. Best for external drives.",
  },
  {
    key: "sftp",
    icon: IconServer,
    label: "SFTP / SSH",
    url: "sftp:user@host:/path",
    desc: "Any server you can SSH into.",
  },
  {
    key: "s3",
    icon: IconCloud,
    label: "Amazon S3",
    url: "s3:s3.amazonaws.com/bucket",
    desc: "Or any S3-compatible (MinIO, R2, Wasabi).",
  },
  {
    key: "b2",
    icon: IconCloud,
    label: "Backblaze B2",
    url: "b2:bucket:prefix",
    desc: "Cheap, durable cloud storage.",
  },
  { key: "azure", icon: IconCloud, label: "Azure Blob", url: "azure:container:prefix" },
  {
    key: "gcs",
    icon: IconCloud,
    label: "Google Cloud Storage",
    url: "gs:bucket:/prefix",
  },
  { key: "rest", icon: IconServer, label: "REST Server", url: "rest:http://host:8000/" },
  {
    key: "rclone",
    icon: IconCloud,
    label: "rclone",
    url: "rclone:remote:path",
    desc: "Use any of 40+ rclone backends.",
  },
];

const WizardStorage = ({ onNext }: { onNext: () => void }) => (
  <WizardFrame
    current={2}
    title="Where should backups live?"
    sub="Vaultik supports any restic-compatible storage backend. Pick one to continue."
    onNext={onNext}
  >
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {BACKENDS.map((b, i) => (
        <div
          key={b.key}
          className="card"
          style={{
            padding: "12px 14px",
            cursor: "pointer",
            borderColor: i === 1 ? "var(--accent-line)" : "var(--border)",
            background: i === 1 ? "var(--accent-soft)" : "var(--surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  i === 1 ? "rgba(52,211,153,0.18)" : "var(--surface-2)",
                border:
                  "1px solid " +
                  (i === 1 ? "var(--accent-line)" : "var(--border)"),
                display: "grid",
                placeItems: "center",
                color: i === 1 ? "var(--accent)" : "var(--text-2)",
              }}
            >
              <b.icon size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}
              >
                {b.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-4)",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {b.url}
              </div>
            </div>
            {i === 1 && (
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "grid",
                  placeItems: "center",
                  color: "#04221a",
                  flexShrink: 0,
                }}
              >
                <IconCheck size={10} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    <div style={{ marginTop: 22 }}>
      <div className="field">
        <label className="label">Repository URL</label>
        <div className="row">
          <input
            className="input mono"
            defaultValue="sftp:ops@db-01.local:/srv/backup/restic"
          />
          <button className="btn">Test connection</button>
        </div>
        <div className="hint">
          Use "Init new repo" on the next step if this repository does not exist
          yet.
        </div>
      </div>
    </div>
  </WizardFrame>
);

const WizardReview = ({ onBack }: { onBack: () => void }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchProfiles } = useAppStore();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const pId = uuidv4();
      const profile: BackupProfile = {
        id: pId,
        name: "My New Profile",
        repo_url: "/tmp/vaultik-repo",
        password_storage: { type: "Keyring", service: "vaultik", account: pId },
        backend_options: [],
        sources: ["/home"],
        excludes: [],
        exclude_caches: true,
        exclude_if_present: [],
        exclude_larger_than: null,
        one_file_system: false,
        tags: [],
        host_override: null,
        retention: { keep_last: null, keep_hourly: null, keep_daily: null, keep_weekly: null, keep_monthly: null, keep_yearly: null, keep_within: null, keep_tags: [] },
        auto_prune: true,
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

      await initRepo("/tmp/vaultik-repo", "password");
      await createProfile(profile, "password");
      await fetchProfiles();
      navigate("/");
    } catch(e) {
      console.error(e);
      alert("Failed to create profile: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardFrame
      current={6}
      title="Review & create"
      sub="Confirm your settings. Vaultik will initialize the repository and start your first backup."
      primaryLabel="Create profile & back up"
      primaryIcon={IconCheck}
      onBack={onBack}
      onNext={handleCreate}
      loading={loading}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ReviewRow
          icon={IconFolder}
          label="Profile"
          value="My New Profile"
          sub="1 source · 0 exclusion patterns"
        />

        <ReviewRow
          icon={IconHdd}
          label="Storage"
          value="Local"
          sub="/tmp/vaultik-repo"
        />

        <ReviewRow
          icon={IconKey}
          label="Security"
          value="Password set · OS Keyring"
          sub="Encryption key never leaves your machine"
        />

        <ReviewRow
          icon={IconClock}
          label="Schedule"
          value="Manual"
          sub="No schedule configured"
        />

        <ReviewRow
          icon={IconShield}
          label="Retention"
          value="Keep all"
          sub="Auto-prune enabled"
        />
      </div>

      <div
        style={{
          marginTop: 22,
          padding: "12px 14px",
          borderRadius: "var(--r-md)",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-line)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          color: "var(--text-2)",
        }}
      >
        <IconShield
          size={14}
          style={{ color: "var(--accent)", marginTop: 1, flexShrink: 0 }}
        />
        <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
          <strong style={{ color: "var(--text)", fontWeight: 600 }}>
            Encrypted before it leaves your machine.
          </strong>{" "}
          Restic encrypts data with AES-256 and authenticates with Poly1305 before
          any upload. Without your password, the repository is unreadable.
        </div>
      </div>
    </WizardFrame>
  );
};

const ReviewRow = ({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) => (
  <div
    className="card"
    style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        display: "grid",
        placeItems: "center",
        color: "var(--gold)",
        flexShrink: 0,
      }}
    >
      <Icon size={14} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-4)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: "var(--text)",
          fontWeight: 500,
          marginTop: 2,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--text-3)",
            marginTop: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      )}
    </div>
    <button className="btn btn-sm btn-ghost">Edit</button>
  </div>
);

export default function Wizard() {
  const [step, setStep] = useState(2);
  
  if (step === 2) return <WizardStorage onNext={() => setStep(6)} />;
  if (step === 6) return <WizardReview onBack={() => setStep(2)} />;
  return null;
}
