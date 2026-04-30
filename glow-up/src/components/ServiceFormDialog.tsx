import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import type { Service, ServiceInsert } from "@/hooks/useServices";
import type { ServiceCategory } from "@/hooks/useServices";
import type { Operator } from "@/hooks/useOperators";
import ServiceCategoryManagerDialog from "@/components/ServiceCategoryManagerDialog";
import { useEffect, useState } from "react";
import { Users, Plus, Package } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  category_id: z.string().optional().default(""),
  duration_minutes: z.coerce.number().min(5),
  price: z.coerce.number().min(0),
  description: z.string().optional().default(""),
  is_package: z.boolean().default(false),
  package_sessions: z.coerce.number().min(1).optional(),
  package_price: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export interface ServiceSubmitData extends ServiceInsert {
  operatorIds?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: (Service & { service_categories?: any }) | null;
  categories: ServiceCategory[];
  operators: Operator[];
  onSubmit: (data: ServiceSubmitData) => void;
  isPending: boolean;
}

export default function ServiceFormDialog({ open, onOpenChange, service, categories, operators, onSubmit, isPending }: Props) {
  const { t } = useTranslation();
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  const activeOperators = operators.filter(op => !op.deleted_at);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", category_id: "", duration_minutes: 30, price: 0, description: "", is_package: false, package_sessions: undefined, package_price: undefined },
  });

  const isPackage = form.watch("is_package");

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        category_id: service.category_id ?? "",
        duration_minutes: service.duration_minutes,
        price: Number(service.price),
        description: service.description ?? "",
        is_package: service.is_package ?? false,
        package_sessions: service.package_sessions ?? undefined,
        package_price: service.package_price != null ? Number(service.package_price) : undefined,
      });
      const assigned = activeOperators.filter(op =>
        op.service_ids?.includes(service.id)
      ).map(op => op.id);
      setSelectedOperatorIds(assigned);
    } else {
      form.reset({ name: "", category_id: "", duration_minutes: 30, price: 0, description: "", is_package: false, package_sessions: undefined, package_price: undefined });
      setSelectedOperatorIds([]);
    }
  }, [service, open]);

  const toggleOperator = (opId: string) => {
    setSelectedOperatorIds(prev =>
      prev.includes(opId) ? prev.filter(id => id !== opId) : [...prev, opId]
    );
  };

  const handleSubmit = (v: FormValues) => {
    const computedPrice = v.is_package && v.package_price && v.package_sessions
      ? v.package_price / v.package_sessions
      : v.price;
    onSubmit({
      name: v.name,
      category_id: v.category_id || null,
      duration_minutes: v.duration_minutes,
      price: computedPrice,
      description: v.description || null,
      is_package: v.is_package,
      package_sessions: v.is_package ? (v.package_sessions ?? null) : null,
      package_price: v.is_package ? (v.package_price ?? null) : null,
      operatorIds: selectedOperatorIds,
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-glowup-id="service-form-dialog">
        <DialogHeader>
          <DialogTitle>{service ? t("services.editService") : t("services.createService")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("services.serviceName")} *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category_id" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("services.category")}</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="flex-1"><SelectValue placeholder={t("services.selectCategory")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.filter(c => !c.deleted_at).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1 text-xs" onClick={() => setCatDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    {t("services.newCategory", "Nuova")}
                  </Button>
                </div>
              </FormItem>
            )} />
            <div className={`grid gap-4 ${isPackage ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <FormField control={form.control} name="duration_minutes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("services.duration")} (min) *</FormLabel>
                  <FormControl><Input {...field} type="number" min={5} step={5} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {!isPackage && (
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("services.price")} (€) *</FormLabel>
                    <FormControl><Input {...field} type="number" min={0} step={0.5} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("services.description")}</FormLabel>
                <FormControl><Textarea {...field} rows={2} /></FormControl>
              </FormItem>
            )} />

            {/* Package toggle */}
            <div className="rounded-xl border border-border/50 p-3 space-y-3">
              <FormField control={form.control} name="is_package" render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <FormLabel className="!mt-0 font-medium">{t("services.isPackage")}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              {isPackage && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <FormField control={form.control} name="package_sessions" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("services.packageSessions")} *</FormLabel>
                      <FormControl><Input {...field} type="number" min={1} placeholder="es. 5" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="package_price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("services.packagePrice")} (€) *</FormLabel>
                      <FormControl><Input {...field} type="number" min={0} step={0.5} placeholder="es. 200" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </div>

            {/* Operator assignment section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">{t("services.assignOperators")}</Label>
              </div>
              {activeOperators.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {t("services.noOperatorsHint")}
                </p>
              ) : (
                <>
                  <p className="text-[11px] text-muted-foreground">{t("services.selectOperators")}</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-border/50 p-2">
                    {activeOperators.map(op => (
                      <label
                        key={op.id}
                        className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedOperatorIds.includes(op.id)}
                          onCheckedChange={() => toggleOperator(op.id)}
                        />
                        <Avatar className="h-6 w-6">
                          {op.photo_url && <AvatarImage src={op.photo_url} />}
                          <AvatarFallback className="text-[10px]">
                            {op.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{op.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("common.loading") : (service ? t("common.save") : t("services.createService"))}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <ServiceCategoryManagerDialog open={catDialogOpen} onOpenChange={setCatDialogOpen} />
    </>
  );
}
