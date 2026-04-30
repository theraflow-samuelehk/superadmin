import {
  Store, Handshake, LifeBuoy, BarChart3, ToggleLeft, LogOut, Shield, Settings, ListTodo, GraduationCap, Plug, Workflow, Target, Facebook, MessageSquare,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const items = [
  { key: "centers", icon: Store },
  { key: "affiliates", icon: Handshake },
  { key: "support", icon: LifeBuoy },
  { key: "analytics", icon: BarChart3 },
  { key: "featureFlags", icon: ToggleLeft },
  { key: "flussi", icon: Workflow },
  { key: "todos", icon: ListTodo },
  { key: "tutorials", icon: GraduationCap },
  { key: "integrations", icon: Plug },
  { key: "funnel", icon: Target },
  { key: "leads", icon: Facebook },
  { key: "leadWhatsapp", icon: MessageSquare },
  { key: "settings", icon: Settings },
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";

  const labelMap: Record<string, string> = {
    centers: t("admin.tabs.centers"),
    affiliates: t("admin.tabs.affiliates"),
    support: t("admin.tabs.support"),
    analytics: t("admin.tabs.analytics"),
    featureFlags: t("admin.tabs.featureFlags"),
    flussi: t("reminderFlow.pageTitle", "Flussi"),
    todos: t("admin.tabs.todos", "To-Do"),
    tutorials: t("tutorials.title", "Tutorial"),
    integrations: t("settings.integrations", "Integrazioni"),
    funnel: "Funnel",
    leads: "Facebook Leads",
    leadWhatsapp: "WA Lead Automazioni",
    settings: t("admin.tabs.settings", "Impostazioni"),
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          {!collapsed && (
            <span className="text-lg font-serif font-bold text-sidebar-foreground truncate">
              GlowUp Admin
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.main")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    tooltip={labelMap[item.key]}
                    onClick={() => onTabChange(item.key)}
                    className={activeTab === item.key ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent"}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{labelMap[item.key]}</span>
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
            <SidebarMenuButton tooltip={t("common.logout")} onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span>{t("common.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
