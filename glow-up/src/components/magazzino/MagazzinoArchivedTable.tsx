import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/hooks/useProducts";

interface Props {
  products: Product[];
  onRestore: (id: string) => void;
}

export default function MagazzinoArchivedTable({ products, onRestore }: Props) {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("inventory.product")}</TableHead>
          <TableHead>{t("inventory.brand")}</TableHead>
          <TableHead>{t("audit.date")}</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id} className="opacity-70">
            <TableCell className="font-medium">{p.name}</TableCell>
            <TableCell className="text-muted-foreground">{p.brand || "—"}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {p.deleted_at ? new Date(p.deleted_at).toLocaleDateString("it-IT") : ""}
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => onRestore(p.id)}>
                <ArchiveRestore className="h-3 w-3" />
                {t("archive.restore")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
