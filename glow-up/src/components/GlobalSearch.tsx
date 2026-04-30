import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Calendar, Users, Scissors, UserCog, CreditCard, Package,
  BarChart3, Settings, Heart, ClipboardList, Brain, Receipt, LayoutDashboard,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";

const PAGES = [
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Agenda", url: "/agenda", icon: Calendar },
  { name: "Clienti", url: "/clienti", icon: Users },
  { name: "Servizi", url: "/servizi", icon: Scissors },
  { name: "Operatrici", url: "/operatori", icon: UserCog },
  { name: "Cassa", url: "/report?tab=cassa", icon: CreditCard },
  { name: "Magazzino", url: "/magazzino", icon: Package },
  { name: "Fidelizzazione", url: "/fidelizzazione", icon: Heart },
  { name: "Staff", url: "/staff", icon: ClipboardList },
  { name: "AI Assistant", url: "/ai-assistant", icon: Brain },
  { name: "Fiscale", url: "/fiscale", icon: Receipt },
  { name: "Report", url: "/report", icon: BarChart3 },
  { name: "Impostazioni", url: "/impostazioni", icon: Settings },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { clients } = useClients();
  const { services } = useServices();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const activeClients = useMemo(
    () => clients.filter((c) => !c.deleted_at).slice(0, 10),
    [clients]
  );

  const activeServices = useMemo(
    () => services.filter((s) => !s.deleted_at).slice(0, 10),
    [services]
  );

  const go = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("common.search") + "... (⌘K)"} />
      <CommandList>
        <CommandEmpty>{t("common.noData")}</CommandEmpty>

        <CommandGroup heading={t("search.pages")}>
          {PAGES.map((p) => (
            <CommandItem key={p.url} onSelect={() => go(p.url)}>
              <p.icon className="mr-2 h-4 w-4" />
              <span>{p.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {activeClients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("clients.title")}>
              {activeClients.map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/clienti/${c.id}`)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{[c.first_name, c.last_name].filter(Boolean).join(" ")}</span>
                  {c.phone && <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {activeServices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("services.title")}>
              {activeServices.map((s) => (
                <CommandItem key={s.id} onSelect={() => go("/servizi")}>
                  <Scissors className="mr-2 h-4 w-4" />
                  <span>{s.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">€{s.price}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
