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
import { ClientPlaceholder } from "./pages/client/ClientPlaceholder";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RequireAuth } from "./components/RequireAuth";
import { AuthProvider } from "./lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBBLICA: home + login + signup */}
          <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />

          {/* PANNELLO SUPER ADMIN: solo super admin */}
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

          {/* PANNELLO CLIENTE: admin/staff di workspace */}
          <Route element={<RequireAuth><ClientLayout /></RequireAuth>}>
            <Route path="/app"          element={<ErrorBoundary><ClientDashboard /></ErrorBoundary>} />
            <Route path="/app/projects" element={<ErrorBoundary><ClientPlaceholder
              title="I tuoi progetti"
              description="Gestisci tutti i progetti del tuo workspace. Crea siti, funnel, landing — tutti con il tuo sottodominio TheraFlow o un dominio custom."
              features={[
                "Crea progetti senza scrivere codice",
                "Modifica le pagine via drag-and-drop",
                "Pubblica con un click su sottodominio o dominio tuo",
                "Vedi visite, lead e fatturato in tempo reale",
              ]}
            /></ErrorBoundary>} />
            <Route path="/app/pages"    element={<ErrorBoundary><ClientPlaceholder
              title="Modifica pagine"
              description="Builder visuale per creare le pagine dei tuoi progetti. Trascina blocchi, scrivi testi, carica immagini — niente codice."
              features={[
                "Drag-and-drop dei blocchi (hero, feature, form, footer…)",
                "Editor di testo inline come Notion",
                "Salvataggio automatico ogni modifica",
                "Anteprima live + pubblicazione in un click",
              ]}
            /></ErrorBoundary>} />
            <Route path="/app/team"     element={<ErrorBoundary><ClientPlaceholder
              title="Team del workspace"
              description="Invita la tua staff e decidi cosa può vedere. Permessi per progetto, log delle attività, gestione inviti."
              features={[
                "Invita membri via email",
                "Permessi granulari per progetto",
                "Vedi chi sta lavorando su cosa",
                "Revoca accessi in un secondo",
              ]}
            /></ErrorBoundary>} />
            <Route path="/app/settings" element={<ErrorBoundary><ClientPlaceholder
              title="Impostazioni workspace"
              description="Cambia nome, logo, colori del workspace. Gestisci dominio custom, fatturazione, e preferenze."
              features={[
                "Brand del workspace (nome, logo, colore)",
                "Dominio custom (collega il tuo dominio reale)",
                "Fatturazione e piano",
                "Notifiche email e Slack",
              ]}
            /></ErrorBoundary>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
