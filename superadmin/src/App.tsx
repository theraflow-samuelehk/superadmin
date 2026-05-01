import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/shell/Layout";
import { ClientLayout } from "./components/shell/ClientLayout";
import { Overview } from "./pages/Overview";
import { Workspaces } from "./pages/Workspaces";
import { WorkspaceDetail } from "./pages/WorkspaceDetail";
import { AllProjects } from "./pages/AllProjects";
import { Users } from "./pages/Users";
import { Login } from "./pages/Login";
import { Placeholder } from "./pages/Placeholder";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { ClientProjects } from "./pages/client/ClientProjects";
import { ClientLeads } from "./pages/client/ClientLeads";
import { ClientTeam } from "./pages/client/ClientTeam";
import { ClientSettings } from "./pages/client/ClientSettings";
import { ClientPlaceholder } from "./pages/client/ClientPlaceholder";
import { ClientProjectDetail } from "./pages/client/ClientProjectDetail";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RequireAuth } from "./components/RequireAuth";
import { AuthProvider } from "./lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBBLICA */}
          <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />

          {/* PANNELLO SUPER ADMIN */}
          <Route element={<RequireAuth superAdmin><Layout /></RequireAuth>}>
            <Route path="/"               element={<ErrorBoundary><Overview /></ErrorBoundary>} />
            <Route path="/workspaces"     element={<ErrorBoundary><Workspaces /></ErrorBoundary>} />
            <Route path="/workspaces/:id" element={<ErrorBoundary><WorkspaceDetail /></ErrorBoundary>} />
            <Route path="/projects"       element={<ErrorBoundary><AllProjects /></ErrorBoundary>} />
            <Route path="/users"          element={<ErrorBoundary><Users /></ErrorBoundary>} />
            <Route path="/domains"        element={<ErrorBoundary><Placeholder title="Domini & DNS"      index="05" /></ErrorBoundary>} />
            <Route path="/billing"        element={<ErrorBoundary><Placeholder title="Billing & Revenue" index="06" /></ErrorBoundary>} />
            <Route path="/activity"       element={<ErrorBoundary><Placeholder title="Audit & Attività"  index="07" /></ErrorBoundary>} />
            <Route path="/settings"       element={<ErrorBoundary><Placeholder title="Impostazioni"      index="08" /></ErrorBoundary>} />
          </Route>

          {/* PANNELLO CLIENTE */}
          <Route element={<RequireAuth><ClientLayout /></RequireAuth>}>
            <Route path="/app"          element={<ErrorBoundary><ClientDashboard /></ErrorBoundary>} />
            <Route path="/app/projects" element={<ErrorBoundary><ClientProjects /></ErrorBoundary>} />
            <Route path="/app/projects/:id" element={<ErrorBoundary><ClientProjectDetail /></ErrorBoundary>} />
            <Route path="/app/leads"    element={<ErrorBoundary><ClientLeads /></ErrorBoundary>} />
            <Route path="/app/pages"    element={<ErrorBoundary><ClientPlaceholder
              title="Builder pagine"
              description="Editor visuale drag-and-drop per creare le pagine dei tuoi progetti. Presto disponibile."
              features={[
                "Trascina blocchi pronti (hero, form, gallery…)",
                "Scrivi testi inline come Notion",
                "Salvataggio automatico",
                "Anteprima live e pubblicazione in un click",
              ]}
            /></ErrorBoundary>} />
            <Route path="/app/team"     element={<ErrorBoundary><ClientTeam /></ErrorBoundary>} />
            <Route path="/app/settings" element={<ErrorBoundary><ClientSettings /></ErrorBoundary>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
