import {
  CalendarPlus, CalendarDays, Star, Camera, MapPin, Settings, LogOut, Sparkles, MessageCircle, ShoppingBag, GraduationCap,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

interface ClientSidebarProps {
  salonName?: string;
  clientName?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  loyaltyEnabled?: boolean;
  shopEnabled?: boolean;
  tutorialsEnabled?: boolean;
}

export function ClientSidebar({ salonName, clientName, activeTab, onTabChange, loyaltyEnabled = true, shopEnabled = false, tutorialsEnabled = false }: ClientSidebarProps) {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";

  const allItems = [
    { key: "book", label: t("portal.book"), icon: CalendarPlus },
    { key: "appointments", label: t("portal.appointments"), icon: CalendarDays },
    { key: "loyalty", label: t("portal.loyalty"), icon: Star },
    { key: "photos", label: t("portal.photos"), icon: Camera },
    { key: "chat", label: t("chat.contactCenter"), icon: MessageCircle },
    { key: "shop", label: t("portal.shop", "Shop"), icon: ShoppingBag },
    { key: "tutorials", label: t("tutorials.title", "Tutorial"), icon: GraduationCap },
    { key: "myCenter", label: t("portal.myCenter"), icon: MapPin },
    { key: "settings", label: t("portal.settingsTitle"), icon: Settings },
  ];
  const items = allItems.filter(item => {
    if (item.key === "loyalty" && !loyaltyEnabled) return false;
    if (item.key === "shop" && !shopEnabled) return false;
    if (item.key === "tutorials" && !tutorialsEnabled) return false;
    return true;
  });

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/portal/login";
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
              {clientName && (
                <span className="text-xs text-sidebar-foreground/60 block truncate">{clientName}</span>
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
