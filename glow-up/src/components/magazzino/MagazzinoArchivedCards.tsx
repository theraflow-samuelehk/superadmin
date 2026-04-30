import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/hooks/useProducts";

interface Props {
  products: Product[];
  onRestore: (id: string) => void;
}

export default function MagazzinoArchivedCards({ products, onRestore }: Props) {
  const { t } = useTranslation();

  return (
    <div className="divide-y divide-border">
      {products.map((p) => (
        <div key={p.id} className="p-3 flex items-center justify-between gap-2 opacity-70">
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{p.name}</p>
            {p.brand && <p className="text-xs text-muted-foreground truncate">{p.brand}</p>}
            <p className="text-xs text-muted-foreground">
              {p.deleted_at ? new Date(p.deleted_at).toLocaleDateString("it-IT") : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1 shrink-0" onClick={() => onRestore(p.id)}>
            <ArchiveRestore className="h-3 w-3" />
            {t("archive.restore")}
          </Button>
        </div>
      ))}
    </div>
  );
}
