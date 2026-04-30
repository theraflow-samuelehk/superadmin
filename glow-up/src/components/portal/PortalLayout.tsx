import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { NotificationBell } from "@/components/NotificationBell";
import { ClientSidebar } from "@/components/portal/ClientSidebar";
import { ClientMobileBottomNav } from "@/components/portal/ClientMobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sparkles } from "lucide-react";

interface PortalLayoutProps {
  children: ReactNode;
  salonName?: string;
  clientName?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  loyaltyEnabled?: boolean;
  shopSlug?: string | null;
  tutorialsEnabled?: boolean;
}

export default function PortalLayout({ children, salonName, clientName, activeTab = "book", onTabChange, loyaltyEnabled = true, shopSlug, tutorialsEnabled = false }: PortalLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="h-full overflow-hidden">
    <SidebarProvider defaultOpen={!isMobile} className="!min-h-0 h-full">
      <div className="h-full flex w-full">
        {!isMobile && (
          <ClientSidebar
            salonName={salonName}
            clientName={clientName}
            activeTab={activeTab}
            onTabChange={onTabChange || (() => {})}
            loyaltyEnabled={loyaltyEnabled}
            shopEnabled={!!shopSlug}
            tutorialsEnabled={tutorialsEnabled}
          />
        )}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 flex items-center justify-between border-b border-primary/20 px-4 bg-gradient-to-r from-primary/20 via-primary/12 to-accent/15 shadow-sm">
            <div className="flex items-center gap-2.5">
              {!isMobile && <SidebarTrigger className="mr-1" />}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-serif font-semibold text-gradient-primary tracking-tight">{salonName || "GlowUp"}</span>
                  {clientName && <span className="text-[11px] text-muted-foreground -mt-0.5">{clientName}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell context="client" />
            </div>
          </header>
          <div className={`flex-1 min-h-0 p-4 sm:p-6 bg-background overflow-auto ${isMobile ? 'pb-20' : ''}`}>
            {children}
          </div>
        </main>
      </div>
      {isMobile && onTabChange && (
        <ClientMobileBottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          loyaltyEnabled={loyaltyEnabled}
          shopEnabled={!!shopSlug}
          tutorialsEnabled={tutorialsEnabled}
        />
      )}
    </SidebarProvider>
    </div>
  );
}
