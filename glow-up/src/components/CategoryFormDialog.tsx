import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().min(1),
  emoji: z.string().optional().default(""),
  sort_order: z.coerce.number().default(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; emoji: string | null; sort_order: number }) => void;
  isPending: boolean;
  editingCategory?: { id: string; name: string; emoji: string | null; sort_order: number } | null;
}

export default function CategoryFormDialog({ open, onOpenChange, onSubmit, isPending, editingCategory }: Props) {
  const { t } = useTranslation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", emoji: "", sort_order: 0 },
  });

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        form.reset({ name: editingCategory.name, emoji: editingCategory.emoji || "", sort_order: editingCategory.sort_order });
      } else {
        form.reset({ name: "", emoji: "", sort_order: 0 });
      }
    }
  }, [open, editingCategory]);

  const handleSubmit = (v: FormValues) => {
    onSubmit({ name: v.name, emoji: v.emoji || null, sort_order: v.sort_order });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingCategory ? t("services.editCategory") : t("services.createCategory")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("services.categoryName")} *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="emoji" render={({ field }) => (
              <FormItem>
                <FormLabel>Emoji</FormLabel>
                <FormControl><Input {...field} placeholder="💅" /></FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("common.loading") : (editingCategory ? t("common.save") : t("services.createCategory"))}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
