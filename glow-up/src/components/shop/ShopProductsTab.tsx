import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useProducts, Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { Package, Loader2, Info, Image, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ShopProductsTab() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { user } = useAuth();
  const { products, isLoading, updateProduct } = useProducts();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);

  const retailProducts = products.filter(p => p.product_type === "retail" && !p.deleted_at);

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setDescription(product.description || "");
    setImageUrl(product.image_url || "");
    setTags((product.tags || []).join(", "));
  };

  const handleImageUpload = async (file: File) => {
    if (!user || !editProduct) return;
    setUploading(true);
    const path = `${user.id}/products/${editProduct.id}-${file.name}`;
    const { error } = await supabase.storage.from("shop-images").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("shop-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success(t("shop.imageUploaded"));
  };

  const handleSave = async () => {
    if (!editProduct) return;
    const parsedTags = tags.split(",").map(t => t.trim()).filter(Boolean);
    await updateProduct.mutateAsync({
      id: editProduct.id,
      description: description || null,
      image_url: imageUrl || null,
      tags: parsedTags,
    });
    setEditProduct(null);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("shop.productsFromInventory")}{" "}
          <Link to="/magazzino" className="underline font-medium text-primary">{t("shop.goToInventory")}</Link>
          {" · "}
          <span className="text-muted-foreground">{t("shop.clickToEditShopFields")}</span>
        </AlertDescription>
      </Alert>

      {retailProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t("shop.noProducts")}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/magazzino">{t("shop.addFromInventory")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {retailProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(product)}>
              <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-10 w-10 text-muted-foreground/40" />
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
                  </div>
                  <span className="font-semibold text-primary">{formatCurrency(product.sale_price)}</span>
                </div>
                {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  {product.category && <Badge variant="secondary" className="text-xs">{product.category}</Badge>}
                  <Badge variant={product.quantity > product.min_quantity ? "default" : "destructive"} className="text-xs">
                    {t("shop.stock")}: {product.quantity}
                  </Badge>
                  {(product.tags || []).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {t("shop.editProductShop")} — {editProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("shop.productDescription")}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={t("shop.productDescriptionPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("shop.productImage")}</Label>
              <div className="space-y-2">
                {imageUrl && <img src={imageUrl} alt="" className="h-32 w-full object-cover rounded-lg" />}
                <Input type="file" accept="image/*" disabled={uploading} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("shop.productTags")}</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="capelli, styling, premium" />
              <p className="text-xs text-muted-foreground">{t("shop.tagsHelp")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={updateProduct.isPending}>
              {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
