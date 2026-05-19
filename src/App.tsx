import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Shell";
import Dashboard from "./pages/Dashboard";
import ProfileEditor from "./pages/ProfileEditor";
import SnapshotBrowser from "./pages/SnapshotBrowser";
import RunHistory from "./pages/RunHistory";
import Settings from "./pages/Settings";
import Wizard from "./pages/Wizard";

export default function App() {
  const SAMPLE_PROFILES = [
    { name: "Home Documents", status: "running" },
    { name: "Photos Library", status: "healthy" },
    { name: "Production DB Server", status: "healthy" },
    { name: "Workstation Projects", status: "warn" },
  ];

  return (
    <div className="v-app">
      <Sidebar profiles={SAMPLE_PROFILES} />
      <div className="v-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/profiles/new" element={<ProfileEditor />} />
          <Route path="/profiles/:id" element={<ProfileEditor />} />
          <Route path="/snapshots/:profileId" element={<SnapshotBrowser />} />
          <Route path="/history" element={<RunHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
