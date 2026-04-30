import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Archive } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/hooks/useProducts";

interface Props {
  products: Product[];
  isRetail: boolean;
  onEdit: (p: Product) => void;
  onArchive: (id: string) => void;
  formatCurrency: (v: number) => string;
}

export default function MagazzinoProductCards({ products, isRetail, onEdit, onArchive, formatCurrency }: Props) {
  const { t } = useTranslation();

  return (
    <div className="divide-y divide-border">
      {products.map((p) => (
        <div key={p.id} className="p-3 active:bg-muted/50 transition-colors" onClick={() => onEdit(p)}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground text-sm truncate">{p.name}</p>
              {p.brand && <p className="text-xs text-muted-foreground truncate">{p.brand}</p>}
              {p.category && <p className="text-xs text-muted-foreground truncate">{p.category}</p>}
            </div>
            {p.quantity <= p.min_quantity ? (
              <Badge variant="destructive" className="text-[10px] shrink-0">{t("common.lowStock")}</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] shrink-0">{t("common.available")}</Badge>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                {t("inventory.quantity")}: <strong className="text-foreground">{p.quantity}</strong>
              </span>
              {isRetail && (
                <span className="font-semibold text-primary">{formatCurrency(p.sale_price)}</span>
              )}
              <span className="text-muted-foreground">{formatCurrency(p.cost_price)}</span>
            </div>
            <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onArchive(p.id)}>
                <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
