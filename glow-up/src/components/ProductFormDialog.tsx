import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useProducts, type Product, type ProductType } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import CategoryManagerDialog from "@/components/CategoryManagerDialog";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  quantity: z.coerce.number().min(0),
  min_quantity: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0),
  cost_price: z.coerce.number().min(0),
  barcode: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  productType?: ProductType;
}

export default function ProductFormDialog({ open, onOpenChange, product, productType = "retail" }: Props) {
  const { t } = useTranslation();
  const { createProduct, updateProduct } = useProducts();
  const { categories } = useProductCategories();
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const isEdit = !!product;
  const effectiveType = isEdit ? product!.product_type : productType;
  const isSupply = effectiveType === "supply";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", brand: "", category: "", quantity: 0, min_quantity: 0,
      sale_price: 0, cost_price: 0, barcode: "", supplier: "", notes: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        brand: product.brand || "",
        category: product.category || "",
        quantity: product.quantity,
        min_quantity: product.min_quantity,
        sale_price: product.sale_price,
        cost_price: product.cost_price,
        barcode: product.barcode || "",
        supplier: product.supplier || "",
        notes: product.notes || "",
      });
    } else {
      form.reset({
        name: "", brand: "", category: "", quantity: 0, min_quantity: 0,
        sale_price: 0, cost_price: 0, barcode: "", supplier: "", notes: "",
      });
    }
  }, [product, open]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      brand: values.brand || null,
      category: values.category || null,
      quantity: values.quantity,
      min_quantity: values.min_quantity,
      sale_price: isSupply ? 0 : values.sale_price,
      cost_price: values.cost_price,
      barcode: values.barcode || null,
      supplier: values.supplier || null,
      notes: values.notes || null,
      product_type: effectiveType,
      description: null,
      image_url: null,
      tags: [],
    };
    if (isEdit) {
      await updateProduct.mutateAsync({ id: product!.id, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {isEdit ? t("inventory.editProduct") : (isSupply ? t("inventory.addSupplyProduct") : t("inventory.addRetailProduct"))}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.productName")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.brand")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.category")}</FormLabel>
                    <div className="flex gap-2">
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={t("inventory.selectCategory")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("inventory.noCategories")}</div>
                          ) : (
                            categories.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.emoji ? `${c.emoji} ` : ""}{c.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1 text-xs" onClick={() => setCatDialogOpen(true)}>
                        <Plus className="h-3.5 w-3.5" />
                        {t("services.newCategory", "Nuova")}
                      </Button>
                    </div>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  {!isSupply && (
                    <FormField control={form.control} name="sale_price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("inventory.salePrice")}</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="cost_price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.costPrice")}</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.quantity")}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="supplier" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.supplier")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("inventory.notes")}</FormLabel>
                  <FormControl><Textarea {...field} rows={2} /></FormControl>
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  {isEdit ? t("common.save") : (isSupply ? t("inventory.addSupplyProduct") : t("inventory.addRetailProduct"))}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CategoryManagerDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
      />
    </>
  );
}
