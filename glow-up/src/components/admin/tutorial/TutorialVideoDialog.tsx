import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, Calendar, Users, Sparkles, UserCog, Wallet,
  MessageCircle, Package, Heart, Workflow, ShoppingBag,
  GraduationCap, Headset, Settings, X,
} from "lucide-react";

/** Sections matching the actual sidebar/bottom-nav menu */
const MENU_SECTIONS = [
  { value: "__none", label: "Nessuna (solo libreria)", icon: X },
  { value: "chat", label: "Chat", icon: MessageCircle },
  { value: "report", label: "Finanze", icon: Wallet },
  { value: "agenda", label: "Agenda", icon: Calendar },
  { value: "clienti", label: "Clienti", icon: Users },
  { value: "servizi", label: "Servizi", icon: Sparkles },
  { value: "shop", label: "Shop", icon: ShoppingBag },
  { value: "fidelizzazione", label: "Fidelizzazione", icon: Heart },
  { value: "operatori", label: "Operatori", icon: UserCog },
  { value: "magazzino", label: "Magazzino", icon: Package },
  { value: "flussi", label: "Flussi", icon: Workflow },
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "impostazioni", label: "Impostazioni", icon: Settings },
  { value: "tutorial", label: "Tutorial", icon: GraduationCap },
  { value: "supporto", label: "Supporto", icon: Headset },
];

interface TutorialVideo {
  id: string;
  title: string;
  description: string | null;
  vimeo_embed_url: string;
  menu_section?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TutorialVideo | null;
  onSave: (data: { title: string; description: string; url: string; menu_section: string | null }) => void;
}

export function TutorialVideoDialog({ open, onOpenChange, editing, onSave }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [menuSection, setMenuSection] = useState("__none");

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || "");
      setDescription(editing?.description || "");
      setUrl(editing?.vimeo_embed_url || "");
      setMenuSection(editing?.menu_section || "__none");
    }
  }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("common.edit") : t("tutorials.addVideo", "Aggiungi video")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("tutorials.videoTitle", "Titolo video")}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Come creare un appuntamento" />
          </div>
          <div className="space-y-2">
            <Label>{t("tutorials.videoDescription", "Descrizione video")}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>{t("tutorials.vimeoUrl", "URL embed Vimeo")}</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://player.vimeo.com/video/..." />
            <p className="text-xs text-muted-foreground">
              Incolla l'URL (https://player.vimeo.com/video/...) oppure l'intero codice &lt;iframe&gt; di Vimeo
            </p>
          </div>
          <div className="space-y-2">
            <Label>Mostra nell'icona <span className="font-bold">?</span> della sezione</Label>
            <Select value={menuSection} onValueChange={setMenuSection}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona sezione..." />
              </SelectTrigger>
              <SelectContent>
                {MENU_SECTIONS.map(s => {
                  const Icon = s.icon;
                  return (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {s.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se assegni una sezione, questo video apparirà nel "?" di quella pagina
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => onSave({
            title,
            description,
            url,
            menu_section: menuSection !== "__none" ? menuSection : null,
          })}>{t("common.saveShort")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
