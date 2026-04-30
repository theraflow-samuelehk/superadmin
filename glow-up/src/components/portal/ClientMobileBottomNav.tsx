import { CalendarPlus, CalendarDays, MessageCircle, Star, Camera, MapPin, Settings, MoreHorizontal, ShoppingBag, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface ClientMobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  loyaltyEnabled?: boolean;
  shopEnabled?: boolean;
  tutorialsEnabled?: boolean;
}

export function ClientMobileBottomNav({ activeTab, onTabChange, loyaltyEnabled = true, shopEnabled = false, tutorialsEnabled = false }: ClientMobileBottomNavProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const mainTabs = [
    { key: "book", icon: CalendarPlus },
    { key: "appointments", icon: CalendarDays },
    { key: "chat", icon: MessageCircle },
    ...(loyaltyEnabled
      ? [{ key: "loyalty", icon: Star }]
      : [{ key: "photos", icon: Camera }]),
  ];

  const moreTabs = [
    ...(loyaltyEnabled ? [{ key: "photos", icon: Camera }] : []),
    ...(shopEnabled ? [{ key: "shop", icon: ShoppingBag }] : []),
    ...(tutorialsEnabled ? [{ key: "tutorials", icon: GraduationCap }] : []),
    { key: "myCenter", icon: MapPin },
    { key: "settings", icon: Settings },
  ];

  const isMoreActive = moreTabs.some(tab => tab.key === activeTab);

  const labelMap: Record<string, string> = {
    book: t("portal.book"),
    appointments: t("portal.appointments"),
    loyalty: t("portal.loyalty"),
    photos: t("portal.photos"),
    chat: t("chat.contactCenter"),
    shop: t("portal.shop", "Shop"),
    tutorials: t("tutorials.title", "Tutorial"),
    myCenter: t("portal.myCenter"),
    settings: t("portal.settingsTitle"),
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around h-14">
        {mainTabs.map((tab) => {
          const active = activeTab === tab.key;
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
