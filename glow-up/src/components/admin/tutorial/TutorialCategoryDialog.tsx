import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TutorialCategory {
  id: string;
  name: string;
  description: string | null;
  topics: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TutorialCategory | null;
  onSave: (data: { name: string; description: string; topics: string }) => void;
}

export function TutorialCategoryDialog({ open, onOpenChange, editing, onSave }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");

  useEffect(() => {
    if (open) {
      setName(editing?.name || "");
      setDescription(editing?.description || "");
      setTopics(editing?.topics || "");
    }
  }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("common.edit") : t("tutorials.addCategory", "Nuovo capitolo")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("tutorials.categoryName", "Nome capitolo")}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Es. L'Agenda" />
          </div>
          <div className="space-y-2">
            <Label>{t("tutorials.categoryDescription", "Descrizione")}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Breve descrizione del capitolo" />
          </div>
          <div className="space-y-2">
            <Label>{t("tutorials.topicsLabel", "Anteprima capitolo (visibile ai clienti)")}</Label>
            <Textarea
              value={topics}
              onChange={e => setTopics(e.target.value)}
              rows={3}
              placeholder="Es. Creare appuntamenti, drag-and-drop, vista giorno/mese..."
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t("tutorials.topicsHint", "Separare gli argomenti con virgola o a capo. I clienti vedranno questa lista quando espandono il capitolo.")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => onSave({ name, description, topics })}>{t("common.saveShort")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
