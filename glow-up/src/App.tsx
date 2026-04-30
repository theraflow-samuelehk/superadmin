// DEBUG-SYNC-CHECK: 2026-03-08T16:20 — se vedi questo su GitHub, la sync funziona!
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ImpersonationProvider } from "@/lib/impersonation";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import { SpotlightProvider } from "@/hooks/useSpotlight";
import { UpdateBanner } from "@/components/UpdateBanner";

const GlobalSearch = lazy(() =>
  import("@/components/GlobalSearch").then((module) => ({ default: module.GlobalSearch }))
);

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Clienti = lazy(() => import("./pages/Clienti"));
const ClienteDettaglio = lazy(() => import("./pages/ClienteDettaglio"));
const Servizi = lazy(() => import("./pages/Servizi"));
const Operatori = lazy(() => import("./pages/Operatori"));
const Cassa = lazy(() => import("./pages/Cassa"));
const Magazzino = lazy(() => import("./pages/Magazzino"));
const Report = lazy(() => import("./pages/Report"));
const Impostazioni = lazy(() => import("./pages/Impostazioni"));
const Admin = lazy(() => import("./pages/Admin"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Fidelizzazione = lazy(() => import("./pages/Fidelizzazione"));
const Flussi = lazy(() => import("./pages/Flussi"));
const PrenotaOnline = lazy(() => import("./pages/PrenotaOnline"));
const Shop = lazy(() => import("./pages/Shop"));
const ShopPublic = lazy(() => import("./pages/ShopPublic"));
const Sedi = lazy(() => import("./pages/Sedi"));
const Supporto = lazy(() => import("./pages/Supporto"));
const ReportOperatori = lazy(() => import("./pages/ReportOperatori"));
const Portal = lazy(() => import("./pages/Portal"));
const PortalInvite = lazy(() => import("./pages/PortalInvite"));
const PortalLogin = lazy(() => import("./pages/PortalLogin"));
const OperatorPortal = lazy(() => import("./pages/OperatorPortal"));
const OperatorPortalLogin = lazy(() => import("./pages/OperatorPortalLogin"));
const OperatorPortalInvite = lazy(() => import("./pages/OperatorPortalInvite"));
const AppRedirect = lazy(() => import("./pages/AppRedirect"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Chat = lazy(() => import("./pages/Chat"));
const AffiliatePortal = lazy(() => import("./pages/AffiliatePortal"));
const AffiliatePortalLogin = lazy(() => import("./pages/AffiliatePortalLogin"));
const AffiliatePortalInvite = lazy(() => import("./pages/AffiliatePortalInvite"));
const SocialPortalEntry = lazy(() => import("./pages/SocialPortalEntry"));
const AppointmentAction = lazy(() => import("./pages/AppointmentAction"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const DemoPrenotazione = lazy(() => import("./pages/DemoPrenotazione"));
const Signup = lazy(() => import("./pages/Signup"));
const AppEntry = lazy(() => import("./pages/AppEntry"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Leads = lazy(() => import("./pages/Leads"));
const ReminderWhatsApp = lazy(() => import("./pages/ReminderWhatsApp"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const hideGlobalSearch = ["/auth", "/signup", "/reset-password"].includes(location.pathname);

  return (
    <>
      <UpdateBanner />
      <ImpersonationBanner />
      {!hideGlobalSearch && (
        <Suspense fallback={null}>
          <GlobalSearch />
        </Suspense>
      )}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/app" element={<AppRedirect />} />
          <Route path="/prenota/:slug" element={<PrenotaOnline />} />
          <Route path="/b/:slug" element={<PrenotaOnline />} />
          <Route path="/demo/prenotazione" element={<DemoPrenotazione />} />
          <Route path="/shop/:slug" element={<ShopPublic />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/clienti" element={<ProtectedRoute><Clienti /></ProtectedRoute>} />
          <Route path="/clienti/:id" element={<ProtectedRoute><ClienteDettaglio /></ProtectedRoute>} />
          <Route path="/servizi" element={<ProtectedRoute><Servizi /></ProtectedRoute>} />
          <Route path="/operatori" element={<ProtectedRoute><Operatori /></ProtectedRoute>} />
          <Route path="/cassa" element={<ProtectedRoute><Cassa /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/magazzino" element={<ProtectedRoute><Magazzino /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/report/operatori" element={<ProtectedRoute><ReportOperatori /></ProtectedRoute>} />
          <Route path="/impostazioni" element={<ProtectedRoute><Impostazioni /></ProtectedRoute>} />
          <Route path="/fidelizzazione" element={<ProtectedRoute><Fidelizzazione /></ProtectedRoute>} />
          <Route path="/flussi" element={<ProtectedRoute><Flussi /></ProtectedRoute>} />
          <Route path="/sedi" element={<ProtectedRoute><Sedi /></ProtectedRoute>} />
          <Route path="/supporto" element={<ProtectedRoute><Supporto /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
          <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
          <Route path="/leads" element={<AdminRoute><Leads /></AdminRoute>} />
          <Route path="/reminder-whatsapp" element={<ProtectedRoute><ReminderWhatsApp /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/portal" element={<ProtectedRoute portalRoute><Portal /></ProtectedRoute>} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/portal/invite/:token" element={<PortalInvite />} />
          <Route path="/portal/social/:slug" element={<SocialPortalEntry />} />
          <Route path="/staff-portal" element={<ProtectedRoute operatorPortalRoute><OperatorPortal /></ProtectedRoute>} />
          <Route path="/staff-portal/login" element={<OperatorPortalLogin />} />
          <Route path="/staff-portal/invite/:token" element={<OperatorPortalInvite />} />
          <Route path="/affiliate-portal" element={<ProtectedRoute affiliatePortalRoute><AffiliatePortal /></ProtectedRoute>} />
          <Route path="/affiliate-portal/login" element={<AffiliatePortalLogin />} />
          <Route path="/affiliate-portal/invite/:token" element={<AffiliatePortalInvite />} />
          <Route path="/appointment-action/:token" element={<AppointmentAction />} />
          <Route path="/app/:token" element={<AppEntry />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ImpersonationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SpotlightProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SpotlightProvider>
        </TooltipProvider>
      </ImpersonationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
