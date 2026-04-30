import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Client, ClientInsert } from "@/hooks/useClients";
import { useEffect } from "react";

const clientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  birth_date: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  allergies: z.string().optional().default(""),
  privacy_consent: z.boolean().default(false),
  source: z.string().optional().default(""),
});

type FormValues = z.infer<typeof clientSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: ClientInsert) => void;
  isPending: boolean;
}

export default function ClientFormDialog({ open, onOpenChange, client, onSubmit, isPending }: Props) {
  const { t } = useTranslation();

  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      birth_date: "",
      notes: "",
      allergies: "",
      privacy_consent: false,
      source: "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        first_name: client.first_name,
        last_name: client.last_name,
        phone: client.phone ?? "",
        email: client.email ?? "",
        birth_date: client.birth_date ?? "",
        notes: client.notes ?? "",
        allergies: client.allergies ?? "",
        privacy_consent: client.privacy_consent,
        source: client.source ?? "",
      });
    } else {
      form.reset({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        birth_date: "",
        notes: "",
        allergies: "",
        privacy_consent: false,
        source: "",
      });
    }
  }, [client, open]);

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone || null,
      email: values.email || null,
      birth_date: values.birth_date || null,
      notes: values.notes || null,
      allergies: values.allergies || null,
      privacy_consent: values.privacy_consent,
      source: values.source || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-glowup-id="client-form-dialog">
        <DialogHeader>
          <DialogTitle>{client ? t("clients.editClient") : t("clients.createClient")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="first_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clients.firstName")} *</FormLabel>
                  <FormControl><Input {...field} data-glowup-id="client-first-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="last_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clients.lastName")} *</FormLabel>
                  <FormControl><Input {...field} data-glowup-id="client-last-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clients.phone")}</FormLabel>
                  <FormControl><Input {...field} type="tel" data-glowup-id="client-phone" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clients.email")}</FormLabel>
                  <FormControl><Input {...field} type="email" data-glowup-id="client-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="birth_date" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("clients.birthDate")}</FormLabel>
                <FormControl><Input {...field} type="date" /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="allergies" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("clients.allergies")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("clients.notes")}</FormLabel>
                <FormControl><Textarea {...field} rows={2} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="source" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("clients.source")}</FormLabel>
                <FormControl><Input {...field} placeholder={t("clients.sourcePlaceholder")} /></FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isPending}>
                 {isPending ? t("common.loading") : (client ? t("common.save") : t("clients.createClient"))}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
