import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, CalendarClock } from "lucide-react";
import type { Operator, OperatorInsert } from "@/hooks/useOperators";
import { useEffect, useRef, useState } from "react";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useOperatorShifts } from "@/hooks/useStaffManagement";

const COLORS = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#6366F1", "#14B8A6"];

const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const DAY_MAP = [1, 2, 3, 4, 5, 6, 0]; // Mon=1...Sun=0

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().optional().default(""),
  specializations: z.string().optional().default(""),
  calendar_color: z.string().default("#8B5CF6"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operator?: Operator | null;
  onSubmit: (data: OperatorInsert) => void;
  isPending: boolean;
}

export default function OperatorFormDialog({ open, onOpenChange, operator, onSubmit, isPending }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { services } = useServices();
  
  const activeServices = services.filter(s => !s.deleted_at);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Shifts
  const { shifts, saveShifts } = useOperatorShifts(operator?.id);
  const [editShifts, setEditShifts] = useState<Record<number, { morningStart: string; morningEnd: string; morningActive: boolean; afternoonStart: string; afternoonEnd: string; afternoonActive: boolean }>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: "", specializations: "", calendar_color: "#8B5CF6" },
  });

  // Init default shifts for new operators
  const getDefaultShifts = () => {
    const initial: typeof editShifts = {};
    DAYS.forEach((_, i) => {
      const dayNum = DAY_MAP[i];
      initial[dayNum] = {
        morningStart: "09:00", morningEnd: "13:00", morningActive: i < 6,
        afternoonStart: "14:00", afternoonEnd: "19:00", afternoonActive: i < 6,
      };
    });
    return initial;
  };

  useEffect(() => {
    if (operator) {
      form.reset({
        name: operator.name,
        email: operator.email ?? "",
        role: operator.role ?? "",
        specializations: operator.specializations?.join(", ") ?? "",
        calendar_color: operator.calendar_color,
      });
      setPhotoPreview(operator.photo_url || null);
      setSelectedServiceIds(operator.service_ids ?? []);
    } else {
      form.reset({ name: "", email: "", role: "", specializations: "", calendar_color: "#8B5CF6" });
      setPhotoPreview(null);
      setSelectedServiceIds([]);
      setEditShifts(getDefaultShifts());
    }
    setPhotoFile(null);
  }, [operator, open]);

  // Sync shifts when loaded from DB (edit mode)
  useEffect(() => {
    if (!operator?.id || shifts.length === 0) return;
    const relevant = shifts.filter(s => s.operator_id === operator.id);
    if (relevant.length === 0) return;
    const initial: typeof editShifts = {};
    DAYS.forEach((_, i) => {
      const dayNum = DAY_MAP[i];
      const dayShifts = relevant.filter((s) => s.day_of_week === dayNum);
      dayShifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
      const morning = dayShifts[0];
      const afternoon = dayShifts[1];
      initial[dayNum] = {
        morningStart: morning?.start_time?.slice(0, 5) || "09:00",
        morningEnd: morning?.end_time?.slice(0, 5) || "13:00",
        morningActive: morning?.is_active ?? (i < 6),
        afternoonStart: afternoon?.start_time?.slice(0, 5) || "14:00",
        afternoonEnd: afternoon?.end_time?.slice(0, 5) || "19:00",
        afternoonActive: afternoon?.is_active ?? (i < 6),
      };
    });
    setEditShifts(initial);
  }, [shifts, operator?.id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSubmit = async (v: FormValues) => {
    let photoUrl = operator?.photo_url ?? null;

    if (photoFile && user) {
      setUploading(true);
      const ext = photoFile.name.split('.').pop();
      const path = `${user.id}/${operator?.id || crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("operator-photos").upload(path, photoFile, { upsert: true });
      setUploading(false);
      if (!error) {
        const { data: urlData } = supabase.storage.from("operator-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    }

    // Save shifts if editing existing operator
    if (operator?.id) {
      const shiftsToSave = Object.entries(editShifts).flatMap(([day, val]) => [
        { day_of_week: parseInt(day), start_time: val.morningStart, end_time: val.morningEnd, is_active: val.morningActive },
        { day_of_week: parseInt(day), start_time: val.afternoonStart, end_time: val.afternoonEnd, is_active: val.afternoonActive },
      ]);
      saveShifts.mutate({ operatorId: operator.id, shifts: shiftsToSave });
    }

    onSubmit({
      name: v.name,
      email: v.email || null,
      role: v.role || null,
      specializations: v.specializations ? v.specializations.split(",").map(s => s.trim()).filter(Boolean) : null,
      calendar_color: v.calendar_color,
      working_hours: operator?.working_hours ?? null,
      photo_url: photoUrl,
      service_ids: selectedServiceIds.length > 0 ? selectedServiceIds : null,
      // Pass shifts data for new operators (will be saved after creation in parent)
      _pendingShifts: !operator ? Object.entries(editShifts).flatMap(([day, val]) => [
        { day_of_week: parseInt(day), start_time: val.morningStart, end_time: val.morningEnd, is_active: val.morningActive },
        { day_of_week: parseInt(day), start_time: val.afternoonStart, end_time: val.afternoonEnd, is_active: val.afternoonActive },
      ]) : undefined,
    } as any);
  };

  const selectedColor = form.watch("calendar_color");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-glowup-id="operator-form-dialog">
        <DialogHeader>
          <DialogTitle>{operator ? t("operators.editOperator") : t("operators.createOperator")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group">
                <Avatar className="h-20 w-20">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt="Operator photo" className="object-cover" />
                  ) : (
                    <AvatarFallback
                      className="text-xl font-bold text-primary-foreground"
                      style={{ backgroundColor: selectedColor }}
                    >
                      {form.watch("name")?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <p className="text-xs text-muted-foreground">{t("operators.uploadPhoto")}</p>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("operators.name")} *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("operators.email")}</FormLabel>
                <FormControl><Input type="email" {...field} placeholder={t("operators.emailPlaceholder")} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("operators.role")}</FormLabel>
                <FormControl><Input {...field} placeholder={t("operators.rolePlaceholder")} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="specializations" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("operators.specializations")}</FormLabel>
                <FormControl><Input {...field} placeholder={t("operators.specPlaceholder")} /></FormControl>
              </FormItem>
            )} />

            {/* Services selection */}
            <div className="space-y-2">
              <FormLabel>{t("operators.assignedServices")}</FormLabel>
              {activeServices.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("operators.noServicesAssigned")}</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {activeServices.map(s => (
                    <label key={s.id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-secondary/50 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedServiceIds.includes(s.id)}
                        onCheckedChange={() => toggleService(s.id)}
                      />
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{s.duration_minutes} min</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t("operators.selectServices")}</p>
            </div>

            <FormField control={form.control} name="calendar_color" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("operators.calendarColor")}</FormLabel>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => field.onChange(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${selectedColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </FormItem>
            )} />




            {/* Shifts */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <FormLabel className="text-base font-semibold">{t("staff.weeklyShifts")}</FormLabel>
              </div>
              {DAYS.map((day, i) => {
                const dayNum = DAY_MAP[i];
                const val = editShifts[dayNum] || { morningStart: "09:00", morningEnd: "13:00", morningActive: i < 6, afternoonStart: "14:00", afternoonEnd: "19:00", afternoonActive: i < 6 };
                return (
                  <div key={dayNum} className="space-y-1 pb-2 border-b border-border/30 last:border-0">
                    <span className="font-medium text-foreground text-sm">{day}</span>
                    {/* Morning */}
                    <div className="flex items-center gap-2 pl-2">
                      <Switch
                        checked={val.morningActive}
                        onCheckedChange={(checked) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, morningActive: checked } }))}
                      />
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{t("staff.morning")}</span>
                      {val.morningActive ? (
                        <div className="flex items-center gap-1">
                          <Input type="time" className="w-[5rem] h-7 text-xs px-1.5" value={val.morningStart}
                            onChange={(e) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, morningStart: e.target.value } }))} />
                          <span className="text-muted-foreground text-xs">–</span>
                          <Input type="time" className="w-[5rem] h-7 text-xs px-1.5" value={val.morningEnd}
                            onChange={(e) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, morningEnd: e.target.value } }))} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{t("settings.closed")}</span>
                      )}
                    </div>
                    {/* Afternoon */}
                    <div className="flex items-center gap-2 pl-2">
                      <Switch
                        checked={val.afternoonActive}
                        onCheckedChange={(checked) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, afternoonActive: checked } }))}
                      />
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{t("staff.afternoon")}</span>
                      {val.afternoonActive ? (
                        <div className="flex items-center gap-1">
                          <Input type="time" className="w-[5rem] h-7 text-xs px-1.5" value={val.afternoonStart}
                            onChange={(e) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, afternoonStart: e.target.value } }))} />
                          <span className="text-muted-foreground text-xs">–</span>
                          <Input type="time" className="w-[5rem] h-7 text-xs px-1.5" value={val.afternoonEnd}
                            onChange={(e) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, afternoonEnd: e.target.value } }))} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{t("settings.closed")}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending || uploading ? t("common.loading") : (operator ? t("common.save") : t("operators.createOperator"))}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
