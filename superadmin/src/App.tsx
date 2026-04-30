import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/shell/Layout";
import { Overview } from "./pages/Overview";
import { Workspaces } from "./pages/Workspaces";
import { WorkspaceDetail } from "./pages/WorkspaceDetail";
import { AllProjects } from "./pages/AllProjects";
import { Users } from "./pages/Users";
import { Login } from "./pages/Login";
import { Placeholder } from "./pages/Placeholder";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
        <Route element={<Layout />}>
          <Route path="/"             element={<ErrorBoundary><Overview /></ErrorBoundary>} />
          <Route path="/workspaces"   element={<ErrorBoundary><Workspaces /></ErrorBoundary>} />
          <Route path="/workspaces/:id" element={<ErrorBoundary><WorkspaceDetail /></ErrorBoundary>} />
          <Route path="/projects"     element={<ErrorBoundary><AllProjects /></ErrorBoundary>} />
          <Route path="/users"        element={<ErrorBoundary><Users /></ErrorBoundary>} />
          <Route path="/domains"      element={<ErrorBoundary><Placeholder title="Domini & DNS"    index="05" /></ErrorBoundary>} />
          <Route path="/billing"      element={<ErrorBoundary><Placeholder title="Billing & Revenue" index="06" /></ErrorBoundary>} />
          <Route path="/activity"     element={<ErrorBoundary><Placeholder title="Audit & Attività" index="07" /></ErrorBoundary>} />
          <Route path="/settings"     element={<ErrorBoundary><Placeholder title="Impostazioni"   index="08" /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
