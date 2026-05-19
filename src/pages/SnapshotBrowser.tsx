import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { TopBar } from "../components/Shell";
import { listSnapshots, browseSnapshot } from "../lib/tauri";
import { Snapshot, LsNode } from "../lib/types";
import {
  IconFolder,
  IconFile,
  IconRestore,
  IconTrash,
  IconSearch,
  IconCheck,
  IconShield,
  IconRefresh,
} from "../components/Icons";

const SnapshotItem = ({ s, active, onClick }: { s: Snapshot, active: boolean, onClick: () => void }) => (
  <div
    onClick={onClick}
    style={{
      padding: "12px 14px",
      borderRadius: 8,
      cursor: "pointer",
      background: active ? "var(--surface-2)" : "transparent",
      border: "1px solid " + (active ? "var(--border-strong)" : "transparent"),
      position: "relative",
    }}
  >
    {active && (
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
          color: active ? "var(--gold)" : "var(--text-2)",
          fontWeight: 500,
        }}
      >
        {s.short_id || s.id?.slice(0, 8)}
      </span>
      <span className="badge" style={{ fontSize: 10, padding: "1px 6px" }}>
        {s.tags.length > 0 ? s.tags.join(",") : "auto"}
      </span>
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--text-4)",
        }}
      >
        {s.summary ? `${(s.summary.total_bytes_processed / 1024 / 1024).toFixed(1)} MB` : ""}
      </span>
    </div>
    <div style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 2 }}>
      {new Date(s.time).toLocaleString()}
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
      {s.paths.join(", ")}
    </div>
  </div>
);

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

export default function SnapshotBrowser() {
  const { profileId } = useParams<{ profileId: string }>();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [activeSnapId, setActiveSnapId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<LsNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profileId) {
      loadSnapshots();
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId && activeSnapId) {
      loadNodes(activeSnapId);
    }
  }, [activeSnapId, profileId]);

  const loadSnapshots = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const data = await listSnapshots(profileId);
      setSnapshots(data);
      if (data.length > 0) setActiveSnapId(data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadNodes = async (snapId: string) => {
    if (!profileId) return;
    try {
      const data = await browseSnapshot(profileId, snapId);
      setNodes(data);
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <>
      <TopBar
        breadcrumb={["Profile", "Snapshots"]}
        title="Snapshots"
        sub={`${snapshots.length} snapshots stored`}
        actions={
          <>
            <button className="btn">
              <IconShield size={12} /> Run check
            </button>
            <button className="btn" onClick={loadSnapshots}>
              <IconRefresh size={12} /> {loading ? "Loading..." : "Refresh"}
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
              {snapshots.map((s) => (
                <SnapshotItem key={s.id} s={s} active={activeSnapId === s.id} onClick={() => setActiveSnapId(s.id!)} />
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
                {nodes.length > 0 ? "Select items" : "No items selected"}
              </span>
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
            {nodes.length === 0 ? <div style={{padding: 20, color: "var(--text-3)"}}>Select a snapshot to browse or no files found.</div> : (
              nodes.map((node, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 10px', alignItems: 'center', cursor: 'pointer', borderRadius: 4 }}
                     onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                     onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                   <span style={{ width: 12 }}></span>
                   <Checkbox state="none" />
                   {node.node_type === 'dir' ? <IconFolder size={14} color="var(--gold)"/> : <IconFile size={14} color="var(--text-3)"/>}
                   <span style={{ flex: 1, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
                   <span style={{ width: 70, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-4)"}}>{node.size != null ? `${(node.size / 1024).toFixed(1)} KB` : "—"}</span>
                   <span style={{ width: 110, textAlign: "right", fontSize: 11, color: "var(--text-4)"}}>{node.mtime ? new Date(node.mtime).toLocaleString() : ""}</span>
                </div>
              ))
            )}
          </div>

          {activeSnapId && (
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
              <span>snapshot {activeSnapId.slice(0, 8)}</span>
              <span style={{ flex: 1 }} />
              <span style={{ color: "var(--accent)" }}>● verified</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
