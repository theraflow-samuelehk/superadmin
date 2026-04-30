import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";

import { SpotlightOverlay } from "@/components/SpotlightOverlay";
import { VideoTutorialFab } from "@/components/VideoTutorialFab";
import OnboardingFlow from "@/components/OnboardingFlow";


import { Button } from "@/components/ui/button";
import { Search, Sparkles, Settings } from "lucide-react";
import { useEmbedded } from "@/contexts/EmbeddedContext";
import { NotificationBell } from "@/components/NotificationBell";

import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { TrialExpiredDialog } from "@/components/TrialExpiredDialog";
import { useLocation } from "react-router-dom";
import { useSalonName } from "@/hooks/useSalonName";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const embedded = useEmbedded();
  const isMobile = useIsMobile();
  const { isTrialExpired, loading: subscriptionLoading } = useSubscription();
  const { user, isSuperAdmin } = useAuth();
  const location = useLocation();
  const salonName = useSalonName();
  const { isEnabled } = useFeatureFlags();
  const tutorialsEnabled = isEnabled("tutorials_portal_enabled");
  const isPricingPage = location.pathname === "/pricing";

  if (embedded) return <>{children}</>;
  const openSearch = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <DashboardInner
      embedded={embedded}
      isMobile={isMobile}
      isTrialExpired={isTrialExpired}
      subscriptionLoading={subscriptionLoading}
      user={user}
      isSuperAdmin={isSuperAdmin}
      isPricingPage={isPricingPage}
      salonName={salonName}
      tutorialsEnabled={tutorialsEnabled}
      openSearch={openSearch}
    >
      {children}
    </DashboardInner>
  );
}

function DashboardInner({ children, embedded, isMobile, isTrialExpired, subscriptionLoading, user, isSuperAdmin, isPricingPage, salonName, tutorialsEnabled, openSearch }: {
  children: React.ReactNode;
  embedded: boolean;
  isMobile: boolean;
  isTrialExpired: boolean;
  subscriptionLoading: boolean;
  user: any;
  isSuperAdmin: boolean;
  isPricingPage: boolean;
  salonName: string;
  tutorialsEnabled: boolean;
  openSearch: () => void;
}) {
  if (embedded) return <>{children}</>;

  return (
    <SidebarProvider className="!min-h-0 h-dvh">
      
      {!subscriptionLoading && isTrialExpired && !!user && !isSuperAdmin && !isPricingPage && <TrialExpiredDialog />}
      <div className="h-full flex w-full overflow-hidden">
        {!isMobile && <AppSidebar tutorialsEnabled={tutorialsEnabled} />}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 flex items-center justify-between border-b border-primary/20 px-4 bg-gradient-to-r from-primary/20 via-primary/12 to-accent/15 shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              {!isMobile && <SidebarTrigger className="mr-1" />}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-serif font-medium text-gradient-primary tracking-tight">{salonName}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2 text-muted-foreground" onClick={openSearch} data-glowup-id="header-search">
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs">Cerca...</span>
                <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  ⌘K
                </kbd>
              </Button>
              <NotificationBell context="salon" />
              <Link to="/impostazioni" data-glowup-id="nav-impostazioni">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </header>
          <div className={`flex-1 min-h-0 p-4 sm:p-6 bg-background overflow-auto ${isMobile ? 'pb-20' : ''}`}>
            {children}
          </div>
        </main>
      </div>
      {isMobile && <MobileBottomNav tutorialsEnabled={tutorialsEnabled} />}
      
      <SpotlightOverlay />
      <VideoTutorialFab />
      <OnboardingFlow />
      
    </SidebarProvider>
  );
}
