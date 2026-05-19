import { TopBar } from "../components/Shell";
import {
  IconFolder,
  IconFile,
  IconChevronRight,
  IconChevronDown,
  IconRestore,
  IconTrash,
  IconSearch,
  IconCheck,
  IconShield,
  IconRefresh,
} from "../components/Icons";

const SNAPSHOTS = [
  {
    id: "8a2f7c1d",
    time: "Today, 14:30",
    paths: "/home/kinan/Documents",
    host: "kinan-desktop",
    files: "21,890",
    size: "4.82 GB",
    active: true,
    tag: "manual",
  },
  {
    id: "3e91bb40",
    time: "Today, 02:00",
    paths: "/home/kinan/Documents",
    host: "kinan-desktop",
    files: "21,743",
    size: "4.79 GB",
    tag: "scheduled",
  },
  {
    id: "f7c4019a",
    time: "Yesterday, 02:00",
    paths: "/home/kinan/Documents",
    host: "kinan-desktop",
    files: "21,690",
    size: "4.78 GB",
    tag: "scheduled",
  },
  {
    id: "2d108e5b",
    time: "May 17, 02:00",
    paths: "/home/kinan/Documents",
    host: "kinan-desktop",
    files: "21,612",
    size: "4.76 GB",
    tag: "scheduled",
  },
  {
    id: "0c4452a7",
    time: "May 16, 02:00",
    paths: "/home/kinan/Documents",
    host: "kinan-desktop",
    files: "21,580",
    size: "4.75 GB",
    tag: "scheduled",
  },
  {
    id: "994b1ef0",
    time: "May 15, 02:00",
    paths: "/home/kinan/Documents",
    host: "kinan-desktop",
    files: "21,478",
    size: "4.72 GB",
    tag: "scheduled",
  },
  {
    id: "5a8f02bc",
    time: "May 14, 02:00",
    paths: "/home/kinan/Documents",
    host: "kinan-desktop",
    files: "21,440",
    size: "4.71 GB",
    tag: "scheduled",
  },
  {
    id: "713dee62",
    time: "May 13, 14:20",
    paths: "/home/kinan/Documents",
    host: "kinan-desktop",
    files: "21,398",
    size: "4.69 GB",
    tag: "manual",
  },
];

const TREE = [
  {
    name: "Documents",
    type: "dir",
    size: "—",
    mod: "Today, 14:28",
    open: true,
    depth: 0,
    checked: "all",
  },
  {
    name: "projects",
    type: "dir",
    size: "1.8 GB",
    mod: "Today, 14:12",
    open: true,
    depth: 1,
    checked: "all",
  },
  {
    name: "vaultik",
    type: "dir",
    size: "412 MB",
    mod: "Today, 14:12",
    open: true,
    depth: 2,
    checked: "all",
  },
  {
    name: "src",
    type: "dir",
    size: "184 MB",
    mod: "Today, 13:55",
    depth: 3,
    checked: "all",
  },
  {
    name: "src-tauri",
    type: "dir",
    size: "228 MB",
    mod: "Today, 13:48",
    depth: 3,
    checked: "all",
  },
  {
    name: "README.md",
    type: "file",
    size: "24 KB",
    mod: "Today, 12:30",
    depth: 3,
    checked: "all",
  },
  {
    name: "package.json",
    type: "file",
    size: "2.1 KB",
    mod: "Yesterday",
    depth: 3,
    checked: "all",
  },
  {
    name: "old-app",
    type: "dir",
    size: "1.4 GB",
    mod: "Mar 12",
    depth: 2,
    checked: "some",
  },
  {
    name: "notes",
    type: "dir",
    size: "62 MB",
    mod: "Today, 09:14",
    open: true,
    depth: 1,
    checked: "some",
  },
  {
    name: "ideas.md",
    type: "file",
    size: "8 KB",
    mod: "Today, 09:14",
    depth: 2,
    checked: "all",
  },
  {
    name: "meeting-2026-05-18.md",
    type: "file",
    size: "14 KB",
    mod: "Yesterday",
    depth: 2,
    checked: "all",
  },
  {
    name: "archive",
    type: "dir",
    size: "48 MB",
    mod: "Apr 03",
    depth: 2,
    checked: "none",
  },
  {
    name: "Photos 2025",
    type: "dir",
    size: "2.4 GB",
    mod: "Apr 28",
    depth: 1,
    checked: "none",
  },
  {
    name: "tax-2025.pdf",
    type: "file",
    size: "1.2 MB",
    mod: "Mar 18",
    depth: 1,
    checked: "none",
  },
];

const TreeRow = ({ item }: { item: typeof TREE[0] }) => {
  const Icon = item.type === "dir" ? IconFolder : IconFile;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px 5px " + (10 + (item.depth || 0) * 18) + "px",
        fontSize: 12.5,
        cursor: "pointer",
        borderRadius: 4,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {item.type === "dir" ? (
        item.open ? (
          <IconChevronDown size={12} style={{ color: "var(--text-4)" }} />
        ) : (
          <IconChevronRight size={12} style={{ color: "var(--text-4)" }} />
        )
      ) : (
        <span style={{ width: 12 }} />
      )}

      <Checkbox state={item.checked as "all" | "some" | "none"} />

      <Icon
        size={13}
        style={{ color: item.type === "dir" ? "var(--gold)" : "var(--text-3)" }}
      />
      <span
        style={{
          flex: 1,
          color: "var(--text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.name}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-4)",
          width: 70,
          textAlign: "right",
        }}
      >
        {item.size}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-4)",
          width: 110,
          textAlign: "right",
        }}
      >
        {item.mod}
      </span>
    </div>
  );
};

const Checkbox = ({ state }: { state: "all" | "some" | "none" }) => {
  const bg =
    state === "all"
      ? "var(--accent)"
      : state === "some"
      ? "var(--accent)"
      : "transparent";
  const border = state === "none" ? "var(--border-strong)" : "var(--accent)";
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: "1.5px solid " + border,
        background: bg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {state === "all" && <IconCheck size={9} style={{ color: "#04221a" }} />}
      {state === "some" && (
        <span
          style={{ width: 7, height: 1.5, background: "#04221a", borderRadius: 1 }}
        />
      )}
    </div>
  );
};

const SnapshotItem = ({ s }: { s: typeof SNAPSHOTS[0] }) => (
  <div
    style={{
      padding: "12px 14px",
      borderRadius: 8,
      cursor: "pointer",
      background: s.active ? "var(--surface-2)" : "transparent",
      border: "1px solid " + (s.active ? "var(--border-strong)" : "transparent"),
      position: "relative",
    }}
  >
    {s.active && (
      <span
        style={{
          position: "absolute",
          left: -1,
          top: 12,
          bottom: 12,
          width: 2,
          background: "var(--gold)",
          borderRadius: 100,
        }}
      />
    )}
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11.5,
          color: s.active ? "var(--gold)" : "var(--text-2)",
          fontWeight: 500,
        }}
      >
        {s.id}
      </span>
      <span className="badge" style={{ fontSize: 10, padding: "1px 6px" }}>
        {s.tag}
      </span>
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--text-4)",
        }}
      >
        {s.size}
      </span>
    </div>
    <div style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 2 }}>
      {s.time}
    </div>
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        color: "var(--text-4)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {s.paths} · {s.files} files
    </div>
  </div>
);

export default function SnapshotBrowser() {
  return (
    <>
      <TopBar
        breadcrumb={["Home Documents", "Snapshots"]}
        title="Snapshots"
        sub="46 snapshots · spanning 7 weeks · 12.4 GB stored (deduplicated)"
        actions={
          <>
            <button className="btn">
              <IconShield size={12} /> Run check
            </button>
            <button className="btn">
              <IconRefresh size={12} /> Refresh
            </button>
          </>
        }
      />
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              gap: 8,
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <IconSearch
                size={12}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-4)",
                }}
              />
              <input
                className="input"
                placeholder="Search snapshots"
                style={{ paddingLeft: 28 }}
              />
            </div>
          </div>
          <div
            className="scroll"
            style={{ flex: 1, overflow: "auto", padding: "8px 8px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {SNAPSHOTS.map((s) => (
                <SnapshotItem key={s.id} s={s} />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Checkbox state="some" />
            <span style={{ fontSize: 12.5 }}>
              <span style={{ color: "var(--text)", fontWeight: 500 }}>
                8 items selected
              </span>
              <span style={{ color: "var(--text-4)" }}> · 412 MB</span>
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn btn-sm btn-ghost">
              <IconTrash size={11} /> Forget snapshot
            </button>
            <button className="btn btn-sm">Restore all</button>
            <button className="btn btn-sm btn-primary">
              <IconRestore size={11} /> Restore selected
            </button>
          </div>

          <div
            style={{
              padding: "6px 18px",
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontSize: 10.5,
              color: "var(--text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 500,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ width: 12 }} />
            <span style={{ width: 14 }} />
            <span style={{ width: 13 }} />
            <span style={{ flex: 1 }}>Name</span>
            <span style={{ width: 70, textAlign: "right" }}>Size</span>
            <span style={{ width: 110, textAlign: "right" }}>Modified</span>
          </div>

          <div
            className="scroll"
            style={{ flex: 1, overflow: "auto", padding: 8 }}
          >
            {TREE.map((t, i) => (
              <TreeRow key={i} item={t} />
            ))}
          </div>

          <div
            style={{
              padding: "10px 18px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-4)",
            }}
          >
            <span>snapshot 8a2f7c1d</span>
            <span>·</span>
            <span>21,890 files · 4.82 GB</span>
            <span style={{ flex: 1 }} />
            <span style={{ color: "var(--accent)" }}>● verified</span>
          </div>
        </div>
      </div>
    </>
  );
}
