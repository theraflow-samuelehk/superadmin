import {
  Calendar, Users, LayoutDashboard,
  Package, Wallet, LogOut, Sparkles, UserCog, Heart, MessageCircle, Headset, ShoppingBag, GraduationCap, Workflow, Facebook, Settings, Send,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";

export function AppSidebar({ tutorialsEnabled = true }: { tutorialsEnabled?: boolean }) {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const collapsed = state === "collapsed";

  const mainItems = [
    { title: t("chat.title"), url: "/chat", icon: MessageCircle },
    { title: t("sidebar.reports"), url: "/report", icon: Wallet },
    { title: t("sidebar.agenda"), url: "/agenda", icon: Calendar },
  ];

  const secondaryItems = [
    { title: t("sidebar.clients"), url: "/clienti", icon: Users },
    { title: t("sidebar.services"), url: "/servizi", icon: Sparkles },
    { title: t("sidebar.shop"), url: "/shop", icon: ShoppingBag },
    { title: t("sidebar.loyalty"), url: "/fidelizzazione", icon: Heart },
    { title: t("sidebar.operators"), url: "/operatori", icon: UserCog },
    { title: t("sidebar.inventory"), url: "/magazzino", icon: Package },
    
    { title: t("waReminder.title", "Reminder WhatsApp"), url: "/reminder-whatsapp", icon: Send },
    ...(isSuperAdmin ? [{ title: "Facebook Leads", url: "/leads", icon: Facebook }] : []),
    { title: t("sidebar.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    ...(tutorialsEnabled ? [{ title: t("tutorials.title", "Tutorial"), url: "/tutorial", icon: GraduationCap }] : []),
    { title: t("support.title"), url: "/supporto", icon: Headset },
    { title: t("settings.title", "Impostazioni"), url: "/impostazioni", icon: Settings },
  ];

  const handleLogout = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    const { clearPortalPreference } = await import("@/lib/portalPreference");
    clearPortalPreference();
    window.location.href = "/auth";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-serif font-semibold text-sidebar-foreground">GlowUp</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.main")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium" data-glowup-id={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium" data-glowup-id={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("common.logout")} onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>{t("common.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
