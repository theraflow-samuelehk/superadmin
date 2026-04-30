import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useOperatorShifts } from "@/hooks/useStaffManagement";
import { Save } from "lucide-react";

const DAY_KEYS = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

interface DayShifts {
  day_of_week: number;
  morning_start: string;
  morning_end: string;
  morning_active: boolean;
  afternoon_start: string;
  afternoon_end: string;
  afternoon_active: boolean;
}

function ShiftSlot({
  label,
  active,
  start,
  end,
  onToggle,
  onStartChange,
  onEndChange,
  closedLabel,
}: {
  label: string;
  active: boolean;
  start: string;
  end: string;
  onToggle: (v: boolean) => void;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  closedLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 pl-2">
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <Switch checked={active} onCheckedChange={onToggle} />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      </div>
      {active ? (
        <div className="flex items-center gap-1.5 min-w-0">
          <Input
            type="time"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-[5.5rem] h-8 text-xs px-2"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input
            type="time"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-[5.5rem] h-8 text-xs px-2"
          />
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">{closedLabel}</span>
      )}
    </div>
  );
}

export default function OperatorShiftsTab({ operatorId }: { operatorId: string }) {
  const { t } = useTranslation();
  const { shifts, isLoading, saveShifts } = useOperatorShifts(operatorId);

  const [localShifts, setLocalShifts] = useState<DayShifts[]>([]);

  useEffect(() => {
    const rows: DayShifts[] = DAY_KEYS.map((day) => {
      const dayShifts = shifts.filter((s) => s.day_of_week === day);
      dayShifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
      const morning = dayShifts[0];
      const afternoon = dayShifts[1];
      return {
        day_of_week: day,
        morning_start: morning?.start_time?.slice(0, 5) || "09:00",
        morning_end: morning?.end_time?.slice(0, 5) || "13:00",
        morning_active: morning?.is_active ?? false,
        afternoon_start: afternoon?.start_time?.slice(0, 5) || "14:00",
        afternoon_end: afternoon?.end_time?.slice(0, 5) || "19:00",
        afternoon_active: afternoon?.is_active ?? false,
      };
    });
    setLocalShifts(rows);
  }, [shifts]);

  const updateShift = (dayIdx: number, field: keyof DayShifts, value: string | boolean) => {
    setLocalShifts((prev) =>
      prev.map((s, i) => (i === dayIdx ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = () => {
    const flatShifts = localShifts.flatMap((day) => [
      { day_of_week: day.day_of_week, start_time: day.morning_start, end_time: day.morning_end, is_active: day.morning_active },
      { day_of_week: day.day_of_week, start_time: day.afternoon_start, end_time: day.afternoon_end, is_active: day.afternoon_active },
    ]);
    saveShifts.mutate({ operatorId, shifts: flatShifts });
  };

  const dayLabels = t("agenda.days", { returnObjects: true }) as string[];
  const getDayLabel = (dow: number) => {
    const map: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
    return dayLabels[map[dow]] || String(dow);
  };

  const closedLabel = t("settings.closed");

  if (isLoading) return <div className="text-muted-foreground text-sm">{t("common.loading")}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">{t("staffPortal.myShifts")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {localShifts.map((shift, idx) => (
          <div key={shift.day_of_week} className="space-y-1.5 pb-3 border-b border-border/30 last:border-0">
            <div className="font-medium text-sm text-foreground">{getDayLabel(shift.day_of_week)}</div>
            <ShiftSlot
              label={t("staff.morning")}
              active={shift.morning_active}
              start={shift.morning_start}
              end={shift.morning_end}
              onToggle={(v) => updateShift(idx, "morning_active", v)}
              onStartChange={(v) => updateShift(idx, "morning_start", v)}
              onEndChange={(v) => updateShift(idx, "morning_end", v)}
              closedLabel={closedLabel}
            />
            <ShiftSlot
              label={t("staff.afternoon")}
              active={shift.afternoon_active}
              start={shift.afternoon_start}
              end={shift.afternoon_end}
              onToggle={(v) => updateShift(idx, "afternoon_active", v)}
              onStartChange={(v) => updateShift(idx, "afternoon_start", v)}
              onEndChange={(v) => updateShift(idx, "afternoon_end", v)}
              closedLabel={closedLabel}
            />
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saveShifts.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            {t("common.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
