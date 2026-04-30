import { Store, Handshake, LifeBuoy, BarChart3, ToggleLeft, Settings, MoreHorizontal, ListTodo, GraduationCap, Plug, Workflow, Target, Facebook, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface AdminMobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainTabs = [
  { key: "centers", icon: Store },
  { key: "affiliates", icon: Handshake },
  { key: "support", icon: LifeBuoy },
];

const moreTabs = [
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

export function AdminMobileBottomNav({ activeTab, onTabChange }: AdminMobileBottomNavProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

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
    leadWhatsapp: "WA Automazioni",
    settings: t("admin.tabs.settings", "Impostazioni"),
  };

  const isMoreActive = moreTabs.some((tab) => tab.key === activeTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around h-14">
        {mainTabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors relative ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{labelMap[tab.key]}</span>
              {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors relative ${
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
                const active = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { onTabChange(tab.key); setOpen(false); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <tab.icon className="h-6 w-6" />
                    <span className="text-[11px] font-medium text-center leading-tight">{labelMap[tab.key]}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
