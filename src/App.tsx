import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Shell";
import Dashboard from "./pages/Dashboard";
import ProfileEditor from "./pages/ProfileEditor";
import SnapshotBrowser from "./pages/SnapshotBrowser";
import RunHistory from "./pages/RunHistory";
import Settings from "./pages/Settings";
import Wizard from "./pages/Wizard";
import { useAppStore } from "./store";
import { useBackupManager } from "./hooks/useBackupManager";

export default function App() {
  const { fetchProfiles } = useAppStore();
  useBackupManager();

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <div className="v-app">
      <Sidebar />
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
