import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { NotificationBell } from "@/components/NotificationBell";
import { OperatorSidebar } from "@/components/portal/OperatorSidebar";
import { OperatorMobileBottomNav } from "@/components/portal/OperatorMobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sparkles } from "lucide-react";

interface OperatorPortalLayoutProps {
  children: ReactNode;
  salonName?: string;
  operatorName?: string;
  permissions?: Record<string, boolean>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  /** Remove padding for full-bleed content like Agenda */
  noPadding?: boolean;
  /** Content manages its own scroll (e.g. Agenda) */
  ownScroll?: boolean;
}

export default function OperatorPortalLayout({
  children,
  salonName,
  operatorName,
  permissions = {},
  activeTab = "appointments",
  onTabChange,
  noPadding = false,
  ownScroll = false,
}: OperatorPortalLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="h-dvh overflow-hidden">
      <SidebarProvider defaultOpen={!isMobile} className="!min-h-0 h-full">
        <div className="h-full flex w-full">
          {!isMobile && (
            <OperatorSidebar
              salonName={salonName}
              operatorName={operatorName}
              permissions={permissions}
              activeTab={activeTab}
              onTabChange={onTabChange || (() => {})}
            />
          )}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="h-14 flex items-center justify-between border-b border-primary/20 px-4 bg-gradient-to-r from-primary/20 via-primary/12 to-accent/15 shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                {!isMobile && <SidebarTrigger className="mr-1" />}
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-lg font-serif font-semibold text-gradient-primary tracking-tight">
                      {salonName || "GlowUp"}
                    </span>
                    {operatorName && (
                      <span className="text-xs text-muted-foreground -mt-0.5">{operatorName}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <NotificationBell context="operator" />
              </div>
            </header>
            <div
              className={`flex-1 min-h-0 bg-background ${ownScroll ? "overflow-hidden" : "overflow-auto"} ${
                ownScroll ? "p-0" : noPadding ? "p-0 sm:p-2" : "p-4 sm:p-6"
              } ${!ownScroll && isMobile ? "pb-20" : ""}`}
            >
              {children}
            </div>
          </main>
        </div>
        {isMobile && onTabChange && (
          <OperatorMobileBottomNav
            activeTab={activeTab}
            onTabChange={onTabChange}
            permissions={permissions}
          />
        )}
      </SidebarProvider>
    </div>
  );
}
