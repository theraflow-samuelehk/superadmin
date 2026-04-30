import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileBottomNav } from "@/components/admin/AdminMobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider className="!min-h-0 h-dvh">
      <div className="h-full flex w-full overflow-hidden">
        {!isMobile && (
          <AdminSidebar activeTab={activeTab} onTabChange={onTabChange} />
        )}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 flex items-center justify-between border-b border-primary/20 px-4 bg-gradient-to-r from-destructive/10 via-destructive/5 to-accent/10 shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              {!isMobile && <SidebarTrigger className="mr-1" />}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 shadow-sm">
                  <Shield className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-lg font-serif font-bold text-foreground tracking-tight">GlowUp Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell context="salon" />
            </div>
          </header>
          <div className={`flex-1 min-h-0 p-4 sm:p-6 bg-background overflow-auto ${isMobile ? 'pb-20' : ''}`}>
            {children}
          </div>
        </main>
      </div>
      {isMobile && (
        <AdminMobileBottomNav activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </SidebarProvider>
  );
}
