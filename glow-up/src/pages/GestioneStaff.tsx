import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, Target, UserCog, Plus, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useOperators } from "@/hooks/useOperators";
import { useOperatorShifts, useOperatorGoals } from "@/hooks/useStaffManagement";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const DAY_MAP = [1, 2, 3, 4, 5, 6, 0]; // Mon=1...Sun=0

export default function GestioneStaff() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { operators } = useOperators();
  const activeOperators = operators.filter((o) => !o.deleted_at);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const { goals, upsertGoal } = useOperatorGoals(currentMonth, currentYear);

  // Selected operator for shifts
  const [selectedOpId, setSelectedOpId] = useState<string>("");
  const { shifts, saveShifts } = useOperatorShifts(selectedOpId || undefined);

  // Shift editing state (dual slots: morning + afternoon)
  const [editShifts, setEditShifts] = useState<Record<number, { morningStart: string; morningEnd: string; morningActive: boolean; afternoonStart: string; afternoonEnd: string; afternoonActive: boolean }>>({});
  // Goal dialog
  const [goalDialog, setGoalDialog] = useState(false);
  const [goalOpId, setGoalOpId] = useState("");
  const [goalRevenue, setGoalRevenue] = useState(0);
  const [goalAppointments, setGoalAppointments] = useState(0);


  // Sync editor when shifts data loads or operator changes
  useEffect(() => {
    if (!selectedOpId) return;
    const relevant = shifts.filter(s => s.operator_id === selectedOpId);
    if (relevant.length === 0) return;
    const initial: Record<number, { morningStart: string; morningEnd: string; morningActive: boolean; afternoonStart: string; afternoonEnd: string; afternoonActive: boolean }> = {};
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
  }, [shifts, selectedOpId]);

  // Save shifts (2 rows per day: morning + afternoon)
  const handleSaveShifts = () => {
    if (!selectedOpId) return;
    const shiftsToSave = Object.entries(editShifts).flatMap(([day, val]) => [
      { day_of_week: parseInt(day), start_time: val.morningStart, end_time: val.morningEnd, is_active: val.morningActive },
      { day_of_week: parseInt(day), start_time: val.afternoonStart, end_time: val.afternoonEnd, is_active: val.afternoonActive },
    ]);
    saveShifts.mutate({ operatorId: selectedOpId, shifts: shiftsToSave });
  };

  // Handle goal save
  const handleSaveGoal = () => {
    if (!goalOpId) return;
    upsertGoal.mutate({
      operator_id: goalOpId,
      month: currentMonth,
      year: currentYear,
      target_revenue: goalRevenue,
      target_appointments: goalAppointments,
    }, { onSuccess: () => setGoalDialog(false) });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{t("staff.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("staff.subtitle")}</p>
        </div>

        <Tabs defaultValue="shifts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="shifts" className="gap-1"><CalendarClock className="h-3.5 w-3.5" />{t("staff.shiftsTab")}</TabsTrigger>
            <TabsTrigger value="goals" className="gap-1"><Target className="h-3.5 w-3.5" />{t("staff.goalsTab")}</TabsTrigger>
          </TabsList>


          {/* SHIFTS TAB */}
          <TabsContent value="shifts" className="space-y-4">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif">{t("staff.weeklyShifts")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedOpId} onValueChange={setSelectedOpId}>
                  <SelectTrigger><SelectValue placeholder={t("staff.selectOperator")} /></SelectTrigger>
                  <SelectContent>
                    {activeOperators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedOpId && (
                  <div className="space-y-4">
                    {DAYS.map((day, i) => {
                      const dayNum = DAY_MAP[i];
                      const val = editShifts[dayNum] || { morningStart: "09:00", morningEnd: "13:00", morningActive: i < 6, afternoonStart: "14:00", afternoonEnd: "19:00", afternoonActive: i < 6 };
                      return (
                        <div key={dayNum} className="space-y-1.5 pb-3 border-b border-border/30 last:border-0">
                          <span className="font-medium text-foreground text-sm">{day}</span>
                          {/* Morning */}
                          <div className="flex items-center gap-2 pl-2">
                            <div className="flex items-center gap-2 shrink-0">
                              <Switch
                                checked={val.morningActive}
                                onCheckedChange={(checked) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, morningActive: checked } }))}
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap w-16">{t("staff.morning")}</span>
                            </div>
                            {val.morningActive ? (
                              <div className="flex items-center gap-1.5">
                                <Input type="time" className="w-[5.5rem] h-8 text-xs px-2" value={val.morningStart}
                                  onChange={(e) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, morningStart: e.target.value } }))} />
                                <span className="text-muted-foreground text-xs">–</span>
                                <Input type="time" className="w-[5.5rem] h-8 text-xs px-2" value={val.morningEnd}
                                  onChange={(e) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, morningEnd: e.target.value } }))} />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">{t("settings.closed")}</span>
                            )}
                          </div>
                          {/* Afternoon */}
                          <div className="flex items-center gap-2 pl-2">
                            <div className="flex items-center gap-2 shrink-0">
                              <Switch
                                checked={val.afternoonActive}
                                onCheckedChange={(checked) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, afternoonActive: checked } }))}
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap w-16">{t("staff.afternoon")}</span>
                            </div>
                            {val.afternoonActive ? (
                              <div className="flex items-center gap-1.5">
                                <Input type="time" className="w-[5.5rem] h-8 text-xs px-2" value={val.afternoonStart}
                                  onChange={(e) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, afternoonStart: e.target.value } }))} />
                                <span className="text-muted-foreground text-xs">–</span>
                                <Input type="time" className="w-[5.5rem] h-8 text-xs px-2" value={val.afternoonEnd}
                                  onChange={(e) => setEditShifts((prev) => ({ ...prev, [dayNum]: { ...val, afternoonEnd: e.target.value } }))} />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">{t("settings.closed")}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <Separator />
                    <Button variant="hero" onClick={handleSaveShifts} disabled={saveShifts.isPending}>
                      {t("common.save")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GOALS TAB */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {t("staff.goalsFor")} {format(new Date(currentYear, currentMonth - 1), "MMMM yyyy", { locale: it })}
              </h2>
              <Button variant="hero" onClick={() => setGoalDialog(true)}>
                <Plus className="h-4 w-4" />{t("staff.setGoal")}
              </Button>
            </div>

            {activeOperators.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("operators.noOperators")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOperators.map((op) => {
                  const goal = goals.find((g) => g.operator_id === op.id);
                  const revenueProgress = goal && goal.target_revenue > 0 ? (goal.actual_revenue / goal.target_revenue) * 100 : 0;
                  const aptProgress = goal && goal.target_appointments > 0 ? (goal.actual_appointments / goal.target_appointments) * 100 : 0;

                  return (
                    <Card key={op.id} className="shadow-card border-border/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: op.calendar_color + "20" }}>
                            <UserCog className="h-5 w-5" style={{ color: op.calendar_color }} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{op.name}</p>
                            {op.role && <p className="text-xs text-muted-foreground">{op.role}</p>}
                          </div>
                        </div>

                        {/* Commission info */}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{t("staff.serviceCommission")}: {(op as any).commission_service_pct || 0}%</span>
                          <span>{t("staff.productCommission")}: {(op as any).commission_product_pct || 0}%</span>
                        </div>

                        {goal ? (
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>{t("staff.revenue")}</span>
                                <span>{formatCurrency(goal.actual_revenue)} / {formatCurrency(goal.target_revenue)}</span>
                              </div>
                              <Progress value={Math.min(revenueProgress, 100)} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>{t("staff.appointments")}</span>
                                <span>{goal.actual_appointments} / {goal.target_appointments}</span>
                              </div>
                              <Progress value={Math.min(aptProgress, 100)} className="h-2" />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">{t("staff.noGoalSet")}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Goal Dialog */}
      <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("staff.setGoal")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("agenda.operator")}</Label>
              <Select value={goalOpId} onValueChange={setGoalOpId}>
                <SelectTrigger><SelectValue placeholder={t("staff.selectOperator")} /></SelectTrigger>
                <SelectContent>
                  {activeOperators.map((op) => <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("staff.targetRevenue")}</Label>
              <Input type="number" value={goalRevenue} onChange={(e) => setGoalRevenue(Number(e.target.value))} min={0} step={100} />
            </div>
            <div>
              <Label>{t("staff.targetAppointments")}</Label>
              <Input type="number" value={goalAppointments} onChange={(e) => setGoalAppointments(Number(e.target.value))} min={0} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSaveGoal} disabled={upsertGoal.isPending}>{t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
