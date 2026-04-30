import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductCategories, type ProductCategory } from "@/hooks/useProductCategories";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CategoryManagerDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { categories, createCategory, updateCategory, deleteCategory } = useProductCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const startEdit = (cat: ProductCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditEmoji(cat.emoji || "");
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateCategory.mutate({ id: editingId, name: editName.trim(), emoji: editEmoji || null }, {
      onSuccess: () => setEditingId(null),
    });
  };

  const saveNew = () => {
    if (!newName.trim()) return;
    createCategory.mutate({ name: newName.trim(), emoji: newEmoji || null }, {
      onSuccess: () => { setNewName(""); setNewEmoji(""); setShowNew(false); },
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteCategory.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("inventory.manageCategories")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.length === 0 && !showNew && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("inventory.noCategories")}</p>
            )}
            {categories.map((cat) =>
              editingId === cat.id ? (
                <div key={cat.id} className="flex items-center gap-2">
                  <Input value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} placeholder="💅" className="w-12 text-center px-1" />
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" autoFocus />
                  <Button type="button" size="icon" variant="ghost" onClick={saveEdit} disabled={updateCategory.isPending}>
                    <Check className="h-4 w-4 text-primary" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div key={cat.id} className="flex items-center gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/50">
                  <span className="text-sm flex-1 truncate">
                    {cat.emoji ? `${cat.emoji} ` : ""}{cat.name}
                  </span>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => setDeleteId(cat.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            )}
          </div>

          {showNew ? (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="💅" className="w-12 text-center px-1" />
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("services.categoryName")} className="flex-1" autoFocus />
              <Button type="button" size="icon" variant="ghost" onClick={saveNew} disabled={createCategory.isPending}>
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => { setShowNew(false); setNewName(""); setNewEmoji(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" />
              {t("services.createCategory")}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("services.deleteCategory")}
        description={t("archive.confirmArchive")}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
}
