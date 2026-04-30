import { CalendarDays, Calendar, Users, CreditCard, Clock, Package, UserCheck, Settings, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface OperatorMobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  permissions: Record<string, boolean>;
}

const fixedTabs = [
  { key: "appointments", icon: CalendarDays },
  { key: "clients", icon: Users, permission: "clients" },
  { key: "pos", icon: CreditCard, permission: "pos" },
];

const extraTabs = [
  { key: "shifts", icon: Clock, permission: "shifts" },
  { key: "inventory", icon: Package, permission: "inventory" },
  { key: "operators", icon: UserCheck, permission: "operators" },
  { key: "settings", icon: Settings },
];

export function OperatorMobileBottomNav({ activeTab, onTabChange, permissions }: OperatorMobileBottomNavProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const labelMap: Record<string, string> = {
    appointments: t("sidebar.agenda", "Agenda"),
    agenda: t("sidebar.agenda", "Agenda"),
    clients: t("sidebar.clients", "Clienti"),
    pos: t("sidebar.pos", "Cassa"),
    shifts: t("staffPortal.myShifts", "Turni"),
    inventory: t("sidebar.inventory", "Magazzino"),
    operators: t("sidebar.operators", "Operatori"),
    settings: t("sidebar.settings", "Impostazioni"),
  };

  const hasPermission = (tab: typeof fixedTabs[number]) =>
    !tab.permission || permissions[tab.permission];

  const moreTabs = extraTabs.filter(tab => !tab.permission || permissions[tab.permission]);
  const isMoreActive = moreTabs.some(tab => tab.key === activeTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around h-14">
        {fixedTabs.map((tab) => {
          const active = activeTab === tab.key;
          const enabled = hasPermission(tab);
          return (
            <button
              key={tab.key}
              onClick={() => enabled && onTabChange(tab.key)}
              disabled={!enabled}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors relative ${
                !enabled ? "text-muted-foreground/30 cursor-not-allowed" :
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${active && enabled ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{labelMap[tab.key]}</span>
              {active && enabled && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
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
              {isMoreActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle className="text-left">{t("sidebar.more", "Altro")}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {moreTabs.map((tab) => {
                const active = activeTab === tab.key;
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
