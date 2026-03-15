import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ProfileEditor from "./pages/ProfileEditor";
import SnapshotBrowser from "./pages/SnapshotBrowser";
import RunHistory from "./pages/RunHistory";
import Settings from "./pages/Settings";
import Wizard from "./pages/Wizard";

export default function App() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
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
      </main>
    </div>
  );
}
