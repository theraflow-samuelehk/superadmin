import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/shell/Layout";
import { Overview } from "./pages/Overview";
import { Workspaces } from "./pages/Workspaces";
import { WorkspaceDetail } from "./pages/WorkspaceDetail";
import { AllProjects } from "./pages/AllProjects";
import { Users } from "./pages/Users";
import { Login } from "./pages/Login";
import { Placeholder } from "./pages/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
          <Route path="/projects" element={<AllProjects />} />
          <Route path="/users" element={<Users />} />
          <Route path="/domains" element={<Placeholder title="Domini & DNS" index="05" />} />
          <Route path="/billing" element={<Placeholder title="Billing & Revenue" index="06" />} />
          <Route path="/activity" element={<Placeholder title="Audit & Attività" index="07" />} />
          <Route path="/settings" element={<Placeholder title="Impostazioni" index="08" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
