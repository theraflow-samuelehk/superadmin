import { Calendar, MoreHorizontal, Package, Heart, MessageCircle, UserCog, Wallet, LayoutDashboard, Sparkles, Headset, Users, ShoppingBag, GraduationCap, Settings, Send } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const mainTabs = [
  { key: "clients", icon: Users, path: "/clienti" },
  { key: "operators", icon: UserCog, path: "/operatori" },
  { key: "agenda", icon: Calendar, path: "/agenda" },
  { key: "services", icon: Sparkles, path: "/servizi" },
];

const baseMoreTabs = [
  { key: "reports", icon: Wallet, path: "/report" },
  { key: "inventory", icon: Package, path: "/magazzino" },
  { key: "shop", icon: ShoppingBag, path: "/shop" },
  { key: "loyalty", icon: Heart, path: "/fidelizzazione" },
  { key: "chat", icon: MessageCircle, path: "/chat" },
  { key: "waReminder", icon: Send, path: "/reminder-whatsapp", labelKey: "waReminder.title" },
  { key: "support", icon: Headset, path: "/supporto" },
  { key: "tutorials", icon: GraduationCap, path: "/tutorial" },
  { key: "settings", icon: Settings, path: "/impostazioni" },
];

export function MobileBottomNav({ tutorialsEnabled = true }: { tutorialsEnabled?: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const moreTabs = tutorialsEnabled ? baseMoreTabs : baseMoreTabs.filter(t => t.key !== "tutorials");

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreTabs.some((tab) => isActive(tab.path));

  const labelMap: Record<string, string> = {
    dashboard: t("sidebar.dashboard"),
    agenda: t("sidebar.agenda"),
    clients: t("sidebar.clients"),
    pos: t("sidebar.pos"),
    services: t("sidebar.services"),
    operators: t("sidebar.operators"),
    chat: t("chat.title"),
    inventory: t("sidebar.inventory"),
    loyalty: t("sidebar.loyalty"),
    locations: t("sidebar.locations"),
    reports: t("sidebar.reports"),
    tutorials: t("tutorials.title", "Tutorial"),
    support: t("support.title"),
    shop: t("sidebar.shop"),
    settings: t("settings.title", "Impostazioni"),
    waReminder: t("waReminder.title", "Reminder WA"),
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around h-14">
        {mainTabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <NavLink
              key={tab.key}
              to={tab.path}
              data-glowup-id={`nav-${tab.path.replace("/", "")}`}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{labelMap[tab.key]}</span>
              {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
            </NavLink>
          );
        })}

        {/* "Altro" button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
                isMoreActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <MoreHorizontal className={`h-5 w-5 ${isMoreActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{t("sidebar.more", "Altro")}</span>
              {isMoreActive && <div className="absolute top-0 w-8 h-0.5 rounded-full bg-primary" />}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle className="text-left">{t("sidebar.more", "Altro")}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {moreTabs.map((tab) => {
                const active = isActive(tab.path);
                return (
                  <NavLink
                    key={tab.key}
                    to={tab.path}
                    onClick={() => setOpen(false)}
                    data-glowup-id={`nav-${tab.path.replace("/", "")}`}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <tab.icon className="h-6 w-6" />
                    <span className="text-[11px] font-medium text-center leading-tight">{labelMap[tab.key]}</span>
                  </NavLink>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
