import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Palette, Package, ShoppingBag } from "lucide-react";
import ShopEditorTab from "@/components/shop/ShopEditorTab";
import ShopProductsTab from "@/components/shop/ShopProductsTab";
import ShopOrdersTab from "@/components/shop/ShopOrdersTab";

export default function Shop() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">{t("shop.title")}</h1>
          <p className="text-muted-foreground">{t("shop.subtitle")}</p>
        </div>

        <Tabs defaultValue="editor" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
            <TabsTrigger value="editor" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">{t("shop.tabs.editor")}</span>
              <span className="sm:hidden">{t("shop.tabs.editorShort")}</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">{t("shop.tabs.products")}</span>
              <span className="sm:hidden">{t("shop.tabs.productsShort")}</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">{t("shop.tabs.orders")}</span>
              <span className="sm:hidden">{t("shop.tabs.ordersShort")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor"><ShopEditorTab /></TabsContent>
          <TabsContent value="products"><ShopProductsTab /></TabsContent>
          <TabsContent value="orders"><ShopOrdersTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
