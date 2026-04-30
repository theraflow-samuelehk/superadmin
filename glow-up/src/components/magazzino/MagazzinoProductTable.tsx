import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function MagazzinoProductTable({ products, isRetail, onEdit, onArchive, formatCurrency }: Props) {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("inventory.product")}</TableHead>
          <TableHead>{t("inventory.brand")}</TableHead>
          <TableHead>{t("inventory.category")}</TableHead>
          <TableHead className="text-center">{t("inventory.quantity")}</TableHead>
          {isRetail && <TableHead>{t("inventory.price")}</TableHead>}
          <TableHead>{t("inventory.costPrice")}</TableHead>
          <TableHead>{t("inventory.status")}</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id} className="cursor-pointer" onClick={() => onEdit(p)}>
            <TableCell className="font-medium">{p.name}</TableCell>
            <TableCell className="text-muted-foreground">{p.brand || "—"}</TableCell>
            <TableCell className="text-muted-foreground">{p.category || "—"}</TableCell>
            <TableCell className="text-center font-semibold">{p.quantity}</TableCell>
            {isRetail && <TableCell className="font-semibold text-primary">{formatCurrency(p.sale_price)}</TableCell>}
            <TableCell className="text-muted-foreground">{formatCurrency(p.cost_price)}</TableCell>
            <TableCell>
              {p.quantity <= p.min_quantity ? (
                <Badge variant="destructive" className="text-xs">{t("common.lowStock")}</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">{t("common.available")}</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={() => onEdit(p)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onArchive(p.id)}>
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
