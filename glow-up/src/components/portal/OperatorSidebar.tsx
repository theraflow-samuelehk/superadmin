import {
  CalendarDays, Package, ShoppingCart, Users, Clock, LogOut, Sparkles, UserCheck, CalendarRange, Settings,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

interface OperatorSidebarProps {
  salonName?: string;
  operatorName?: string;
  permissions: Record<string, boolean>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function OperatorSidebar({ salonName, operatorName, permissions, activeTab, onTabChange }: OperatorSidebarProps) {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";

  const items: { key: string; label: string; icon: React.ElementType; permKey?: string }[] = [
    { key: "appointments", label: t("staffPortal.myAppointments"), icon: CalendarDays },
  ];
  if (permissions.shifts) items.push({ key: "shifts", label: t("staffPortal.myShifts"), icon: Clock });
  if (permissions.inventory) items.push({ key: "inventory", label: t("sidebar.inventory"), icon: Package });
  if (permissions.pos) items.push({ key: "pos", label: t("sidebar.pos"), icon: ShoppingCart });
  if (permissions.clients) items.push({ key: "clients", label: t("sidebar.clients"), icon: Users });
  if (permissions.operators) items.push({ key: "operators", label: t("staffPortal.permissionLabels.operators"), icon: UserCheck });
  items.push({ key: "settings", label: t("settings.title"), icon: Settings });

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/staff-portal/login";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-lg font-serif font-bold text-sidebar-foreground block truncate">{salonName || "GlowUp"}</span>
              {operatorName && (
                <span className="text-xs text-sidebar-foreground/60 block truncate">{operatorName}</span>
              )}
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.main")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    onClick={() => onTabChange(item.key)}
                    className={activeTab === item.key ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent"}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
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
