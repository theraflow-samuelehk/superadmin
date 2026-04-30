import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, AlertTriangle, TrendingDown, Euro, ArchiveRestore, Archive, Edit, ShoppingBag, Wrench, Tags } from "lucide-react";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useProducts, type Product, type ProductType } from "@/hooks/useProducts";
import ProductFormDialog from "@/components/ProductFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import MagazzinoProductTable from "@/components/magazzino/MagazzinoProductTable";
import MagazzinoProductCards from "@/components/magazzino/MagazzinoProductCards";
import MagazzinoArchivedTable from "@/components/magazzino/MagazzinoArchivedTable";
import MagazzinoArchivedCards from "@/components/magazzino/MagazzinoArchivedCards";

export default function Magazzino() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { products, isLoading, archiveProduct, restoreProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [mainTab, setMainTab] = useState<ProductType>("retail");
  const isMobile = useIsMobile();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        (p.product_type === mainTab) &&
        (p.name.toLowerCase().includes(q) || (p.brand?.toLowerCase().includes(q) ?? false))
    );
  }, [products, search, mainTab]);

  const active = filtered.filter((p) => !p.deleted_at);
  const archived = filtered.filter((p) => p.deleted_at);

  const activeAll = products.filter((p) => !p.deleted_at && p.product_type === mainTab);
  const lowStock = activeAll.filter((p) => p.quantity <= p.min_quantity);
  const inventoryValue = activeAll.reduce((s, p) => s + p.cost_price * p.quantity, 0);

  const stats = [
    { label: t("inventory.totalProducts"), value: String(activeAll.length), icon: Package },
    { label: t("inventory.inventoryValue"), value: formatCurrency(inventoryValue), icon: Euro },
    { label: t("inventory.lowStock"), value: String(lowStock.length), icon: AlertTriangle },
    { label: t("inventory.toReorder"), value: String(lowStock.length), icon: TrendingDown },
  ];

  const openNew = () => { setEditingProduct(null); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditingProduct(p); setDialogOpen(true); };

  const isRetail = mainTab === "retail";

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">{t("inventory.title")}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isRetail ? t("inventory.retailSubtitle") : t("inventory.supplySubtitle")}
            </p>
          </div>
          <Button variant="hero" size={isMobile ? "default" : "lg"} onClick={openNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {isRetail ? t("inventory.addRetailProduct") : t("inventory.addSupplyProduct")}
          </Button>
        </div>

        {/* Main tabs: Retail / Supply */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as ProductType)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="retail" className="gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              {t("inventory.retail")}
            </TabsTrigger>
            <TabsTrigger value="supply" className="gap-1.5">
              <Wrench className="h-4 w-4" />
              {t("inventory.supply")}
            </TabsTrigger>
          </TabsList>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((s) => (
              <Card key={s.label} className="shadow-card border-border/50">
                <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                    <p className="text-sm sm:text-lg font-semibold text-foreground truncate">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search + Categories */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("inventory.searchProduct")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sub-tabs: Active / Archived */}
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">{t("archive.active")} ({active.length})</TabsTrigger>
              <TabsTrigger value="archived">{t("archive.tab")} ({archived.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Card className="shadow-card border-border/50">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : active.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{t("inventory.noProducts")}</p>
                  ) : isMobile ? (
                    <MagazzinoProductCards
                      products={active}
                      isRetail={isRetail}
                      onEdit={openEdit}
                      onArchive={(id) => archiveProduct.mutate(id)}
                      formatCurrency={formatCurrency}
                    />
                  ) : (
                    <MagazzinoProductTable
                      products={active}
                      isRetail={isRetail}
                      onEdit={openEdit}
                      onArchive={(id) => archiveProduct.mutate(id)}
                      formatCurrency={formatCurrency}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="archived">
              {archived.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("archive.noArchived")}</p>
              ) : (
                <Card className="shadow-card border-border/50">
                  <CardContent className="p-0">
                    {isMobile ? (
                      <MagazzinoArchivedCards
                        products={archived}
                        onRestore={(id) => restoreProduct.mutate(id)}
                      />
                    ) : (
                      <MagazzinoArchivedTable
                        products={archived}
                        onRestore={(id) => restoreProduct.mutate(id)}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </Tabs>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        productType={mainTab}
      />

    </DashboardLayout>
  );
}
