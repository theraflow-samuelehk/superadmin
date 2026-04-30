import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CassaContent from "@/components/CassaContent";
import {
  Plus, ChevronLeft, ChevronRight, Download, Trash2, Pencil,
  Tag, Users, TrendingUp, CreditCard, Banknote, ArrowUpRight, ArrowDownRight,
  Receipt, CalendarCheck, PenLine, ChevronDown, ChevronUp,
  Wallet, PiggyBank, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useBalance, type BalanceEntry } from "@/hooks/useBalance";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO,
  startOfDay, endOfDay, addDays, subDays,
  startOfWeek, endOfWeek, addWeeks, subWeeks,
  startOfYear, endOfYear, addYears, subYears,
} from "date-fns";
import { it } from "date-fns/locale";
import { exportToCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "day" | "week" | "month" | "year";

/* ─── Category palette ─── */
const CATEGORY_COLORS = [
  "hsl(340, 55%, 52%)",   // rosa intenso
  "hsl(346, 50%, 60%)",   // rosa medio
  "hsl(350, 45%, 66%)",   // rosa chiaro
  "hsl(355, 40%, 72%)",   // rosa pastello
  "hsl(338, 35%, 58%)",   // malva rosa
  "hsl(330, 40%, 64%)",   // rosa antico
  "hsl(345, 30%, 70%)",   // rosa tenue
  "hsl(352, 25%, 75%)",   // rosa pallido
  "hsl(335, 45%, 55%)",   // fucsia morbido
  "hsl(348, 35%, 62%)",   // rosa polvere
  "hsl(342, 28%, 68%)",   // rosa cipria
  "hsl(356, 22%, 78%)",   // rosa sabbia
];
const PROFIT_COLOR = "hsl(152, 55%, 48%)";

/* ─── Animated Counter ─── */
function AnimatedNumber({ value, formatFn }: { value: number; formatFn: (n: number) => string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = ref.current ?? 0;
    ref.current = value;
    const duration = 600;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{formatFn(display)}</>;
}

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] as const } },
};

export default function Report() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "bilancio";

  /* ─── State ─── */
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BalanceEntry | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [entryType, setEntryType] = useState<"income" | "expense">("expense");
  const [entryCategory, setEntryCategory] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [entryDescription, setEntryDescription] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [hoveredSlice, setHoveredSlice] = useState<{ name: string; value: number; color: string } | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    switch (viewMode) {
      case "day":
        return { from: format(startOfDay(currentDate), "yyyy-MM-dd"), to: format(endOfDay(currentDate), "yyyy-MM-dd") };
      case "week": {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        const we = endOfWeek(currentDate, { weekStartsOn: 1 });
        return { from: format(ws, "yyyy-MM-dd"), to: format(we, "yyyy-MM-dd") };
      }
      case "year":
        return { from: format(startOfYear(currentDate), "yyyy-MM-dd"), to: format(endOfYear(currentDate), "yyyy-MM-dd") };
      default:
        return { from: format(startOfMonth(currentDate), "yyyy-MM-dd"), to: format(endOfMonth(currentDate), "yyyy-MM-dd") };
    }
  }, [viewMode, currentDate]);

  const prevRange = useMemo(() => {
    switch (viewMode) {
      case "day": {
        const prev = subDays(currentDate, 1);
        return { from: format(startOfDay(prev), "yyyy-MM-dd"), to: format(endOfDay(prev), "yyyy-MM-dd") };
      }
      case "week": {
        const prev = subWeeks(currentDate, 1);
        const ws = startOfWeek(prev, { weekStartsOn: 1 });
        const we = endOfWeek(prev, { weekStartsOn: 1 });
        return { from: format(ws, "yyyy-MM-dd"), to: format(we, "yyyy-MM-dd") };
      }
      case "year": {
        const prev = subYears(currentDate, 1);
        return { from: format(startOfYear(prev), "yyyy-MM-dd"), to: format(endOfYear(prev), "yyyy-MM-dd") };
      }
      default: {
        const prev = subMonths(currentDate, 1);
        return { from: format(startOfMonth(prev), "yyyy-MM-dd"), to: format(endOfMonth(prev), "yyyy-MM-dd") };
      }
    }
  }, [viewMode, currentDate]);

  const {
    allEntries, stats, categories, isLoading,
    createEntry, updateEntry, deleteEntry, createCategory, deleteCategory,
  } = useBalance(dateRange);

  const { stats: prevStats } = useBalance(prevRange);

  /* ─── Annual data ─── */
  const annualQuery = useQuery({
    queryKey: ["balance_annual_chart", user?.id],
    queryFn: async () => {
      const months: { month: string; monthShort: string; entrate: number; costi: number }[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const mStart = format(startOfMonth(d), "yyyy-MM-dd");
        const mEnd = format(endOfMonth(d), "yyyy-MM-dd");
        const label = format(d, "MMM", { locale: it });
        const { data: entries } = await supabase
          .from("balance_entries")
          .select("entry_type, amount")
          .gte("entry_date", mStart)
          .lte("entry_date", mEnd);
        const { data: txs } = await supabase
          .from("transactions")
          .select("total")
          .eq("status", "completed")
          .is("deleted_at", null)
          .gte("created_at", new Date(`${mStart}T00:00:00`).toISOString())
          .lte("created_at", new Date(`${mEnd}T23:59:59`).toISOString());
        const manualIncome = (entries ?? []).filter(e => e.entry_type === "income").reduce((s, e) => s + Number(e.amount), 0);
        const manualExpense = (entries ?? []).filter(e => e.entry_type === "expense").reduce((s, e) => s + Number(e.amount), 0);
        const txIncome = (txs ?? []).reduce((s, tx) => s + Number(tx.total), 0);
        months.push({
          month: label,
          monthShort: label.charAt(0).toUpperCase() + label.slice(1),
          entrate: Math.round(manualIncome + txIncome),
          costi: Math.round(manualExpense),
        });
      }
      return months;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  /* ─── Derived data ─── */
  const netProfit = stats.balance;
  const profitMargin = stats.margin;
  const totalCosts = stats.expenseTotal;
  const revenue = stats.incomeTotal;

  const revenueChange = useMemo(() => {
    if (prevStats.incomeTotal === 0) return null;
    return ((revenue - prevStats.incomeTotal) / prevStats.incomeTotal) * 100;
  }, [revenue, prevStats.incomeTotal]);

  const profitChange = useMemo(() => {
    if (prevStats.balance === 0) return null;
    return ((netProfit - prevStats.balance) / Math.abs(prevStats.balance)) * 100;
  }, [netProfit, prevStats.balance]);

  const paymentStats = useMemo(() => {
    const txEntries = allEntries.filter((e) => e.source === "transaction");
    const total = txEntries.reduce((s, e) => s + e.amount, 0);
    if (total === 0) return { cardPct: 0, cashPct: 0, otherPct: 0 };
    const cash = txEntries.filter((e) => e.category.toLowerCase().includes("contant")).reduce((s, e) => s + e.amount, 0);
    const card = txEntries.filter((e) => e.category.toLowerCase().includes("cart")).reduce((s, e) => s + e.amount, 0);
    return {
      cardPct: Math.round((card / total) * 100),
      cashPct: Math.round((cash / total) * 100),
      otherPct: Math.round(((total - cash - card) / total) * 100),
    };
  }, [allEntries]);

  // Expense categories for breakdown
  const expenseByCat = useMemo(() => {
    const map: Record<string, number> = {};
    allEntries.filter((e) => e.type === "expense").forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value: Math.round(value), color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  }, [allEntries]);

  // Donut data
  const donutData = useMemo(() => {
    const slices = [...expenseByCat];
    if (netProfit > 0) {
      slices.push({ name: t("balance.netProfit"), value: Math.round(netProfit), color: PROFIT_COLOR });
    }
    return slices;
  }, [expenseByCat, netProfit, t]);

  const donutTotal = useMemo(() => donutData.reduce((s, d) => s + d.value, 0), [donutData]);

  // Grouped entries for accordion
  const groupedEntries = useMemo(() => {
    const groups: Record<string, { type: "income" | "expense"; entries: typeof allEntries; total: number }> = {};
    const incomeEntries = allEntries.filter((e) => e.type === "income");
    if (incomeEntries.length > 0) {
      groups["__REVENUE__"] = { type: "income", entries: incomeEntries, total: incomeEntries.reduce((s, e) => s + e.amount, 0) };
    }
    allEntries.filter((e) => e.type === "expense").forEach((e) => {
      if (!groups[e.category]) groups[e.category] = { type: "expense", entries: [], total: 0 };
      groups[e.category].entries.push(e);
      groups[e.category].total += e.amount;
    });
    const sorted: [string, typeof groups[string]][] = [];
    if (groups["__REVENUE__"]) sorted.push(["__REVENUE__", groups["__REVENUE__"]]);
    Object.entries(groups).filter(([k]) => k !== "__REVENUE__").sort((a, b) => b[1].total - a[1].total).forEach((entry) => sorted.push(entry));
    return sorted;
  }, [allEntries]);

  /* ─── Helpers ─── */
  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const openNewEntry = () => {
    setEditingEntry(null);
    setEntryType("expense");
    setEntryCategory("");
    setEntryAmount("");
    setEntryDate(format(new Date(), "yyyy-MM-dd"));
    setEntryDescription("");
    setShowEntryDialog(true);
  };

  const openEditEntry = (entry: BalanceEntry) => {
    setEditingEntry(entry);
    setEntryType(entry.entry_type);
    setEntryCategory(entry.category);
    setEntryAmount(String(entry.amount));
    setEntryDate(entry.entry_date);
    setEntryDescription(entry.description || "");
    setShowEntryDialog(true);
  };

  const handleSaveEntry = () => {
    const amount = parseFloat(entryAmount);
    if (!entryCategory || isNaN(amount) || amount <= 0) return;
    const data = { entry_type: entryType, category: entryCategory, amount, entry_date: entryDate, description: entryDescription || undefined };
    if (editingEntry) {
      updateEntry.mutate({ ...data, id: editingEntry.id });
    } else {
      createEntry.mutate(data);
    }
    setShowEntryDialog(false);
  };

  const handleExport = () => {
    exportToCsv("bilancio", allEntries, [
      { header: "Data", accessor: (e) => e.date },
      { header: "Tipo", accessor: (e) => e.type === "income" ? "Entrata" : "Uscita" },
      { header: "Categoria", accessor: (e) => e.category },
      { header: "Importo", accessor: (e) => e.amount },
      { header: "Descrizione", accessor: (e) => e.description || "" },
      { header: "Fonte", accessor: (e) => e.source },
    ]);
  };

  const incomeCategories = categories.filter((c) => c.entry_type === "income");
  const expenseCategories = categories.filter((c) => c.entry_type === "expense");
  const currentCategories = entryType === "income" ? incomeCategories : expenseCategories;

  const navigatorLabel = useMemo(() => {
    switch (viewMode) {
      case "day": return format(currentDate, "d MMMM yyyy", { locale: it });
      case "week": {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        const we = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(ws, "d MMM", { locale: it })} – ${format(we, "d MMM yyyy", { locale: it })}`;
      }
      case "year": return format(currentDate, "yyyy");
      default: return format(currentDate, "MMMM yyyy", { locale: it });
    }
  }, [viewMode, currentDate]);

  const navigatePrev = () => {
    switch (viewMode) {
      case "day": setCurrentDate((d) => subDays(d, 1)); break;
      case "week": setCurrentDate((d) => subWeeks(d, 1)); break;
      case "year": setCurrentDate((d) => subYears(d, 1)); break;
      default: setCurrentDate((d) => subMonths(d, 1));
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case "day": setCurrentDate((d) => addDays(d, 1)); break;
      case "week": setCurrentDate((d) => addWeeks(d, 1)); break;
      case "year": setCurrentDate((d) => addYears(d, 1)); break;
      default: setCurrentDate((d) => addMonths(d, 1));
    }
  };

  const SourceIcon = ({ source }: { source: string }) => {
    if (source === "transaction") return <Receipt className="h-3 w-3 text-muted-foreground" />;
    if (source === "appointment") return <CalendarCheck className="h-3 w-3 text-emerald-500" />;
    return <PenLine className="h-3 w-3 text-muted-foreground" />;
  };

  const ChangeBadge = ({ change }: { change: number | null }) => {
    if (change === null) return null;
    const isPositive = change >= 0;
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full",
        isPositive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      )}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  return (
    <DashboardLayout>
      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })} className="space-y-4">
        <TabsList className="bg-muted/50 rounded-full p-0.5 w-auto">
          <TabsTrigger value="bilancio" className="rounded-full text-xs data-[state=active]:shadow-sm px-4">{t("balance.title")}</TabsTrigger>
          <TabsTrigger value="cassa" className="rounded-full text-xs data-[state=active]:shadow-sm px-4">{t("sidebar.pos")}</TabsTrigger>
        </TabsList>

        <TabsContent value="bilancio" className="mt-0">
      <div className="space-y-4 sm:space-y-6 pb-8">

        {/* ═══ Header ═══ */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl lg:text-2xl font-serif font-semibold text-foreground">{t("balance.title")}</h1>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/report/operatori")}>
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCategoryDialog(true)}>
                <Tag className="h-4 w-4" />
              </Button>
              <Button size="sm" className="h-8 gap-1 px-3 rounded-full" onClick={openNewEntry}>
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs hidden sm:inline">{t("balance.newEntry")}</span>
              </Button>
            </div>
          </div>

          {/* View Mode Toggle + Navigator */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              variant="outline"
              size="sm"
              className="bg-muted/50 rounded-full p-0.5 w-full sm:w-auto"
            >
              {([
                { value: "day", label: t("balance.dayFull") },
                { value: "week", label: t("balance.weekFull") },
                { value: "month", label: t("balance.monthFull") },
                { value: "year", label: t("balance.yearFull") },
              ] as const).map((mode) => (
                <ToggleGroupItem
                  key={mode.value}
                  value={mode.value}
                  className="flex-1 sm:flex-none text-xs font-normal px-3.5 py-1 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm rounded-full border-0"
                >
                  {mode.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium capitalize min-w-[140px] sm:min-w-[180px] text-center">
                {navigatorLabel}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ═══ KPI Cards ═══ */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
          {/* Revenue */}
          <Card className="border-border/30 shadow-sm overflow-hidden">
            <CardContent className="flex items-center gap-3 p-3 sm:block sm:p-4">
              <div className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Wallet className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal uppercase tracking-wide sm:flex sm:items-center sm:gap-1.5 sm:mb-2">{t("balance.revenue")}</span>
                {isLoading ? <Skeleton className="h-6 w-24 mt-0.5" /> : (
                  <div className="flex items-center gap-2 sm:block">
                    <p className="text-lg sm:text-2xl font-semibold text-foreground tabular-nums tracking-tight">
                      <AnimatedNumber value={revenue} formatFn={formatCurrency} />
                    </p>
                    <div className="sm:mt-1 shrink-0">
                      <ChangeBadge change={revenueChange} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Costs */}
          <Card className="border-border/30 shadow-sm overflow-hidden">
            <CardContent className="flex items-center gap-3 p-3 sm:block sm:p-4">
              <div className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <ArrowDownRight className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal uppercase tracking-wide sm:flex sm:items-center sm:gap-1.5 sm:mb-2">{t("balance.totalCosts")}</span>
                {isLoading ? <Skeleton className="h-6 w-24 mt-0.5" /> : (
                  <p className="text-lg sm:text-2xl font-semibold text-foreground tabular-nums tracking-tight">
                    <AnimatedNumber value={totalCosts} formatFn={formatCurrency} />
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="border-border/30 shadow-sm overflow-hidden">
            <CardContent className="flex items-center gap-3 p-3 sm:block sm:p-4">
              <div className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <PiggyBank className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal uppercase tracking-wide sm:flex sm:items-center sm:gap-1.5 sm:mb-2">{t("balance.netProfit")}</span>
                {isLoading ? <Skeleton className="h-6 w-24 mt-0.5" /> : (
                  <div className="flex items-center gap-2 sm:block">
                    <p className={cn(
                      "text-lg sm:text-2xl font-semibold tabular-nums tracking-tight",
                      netProfit >= 0 ? "text-emerald-600" : "text-destructive"
                    )}>
                      <AnimatedNumber value={netProfit} formatFn={formatCurrency} />
                    </p>
                    <div className="sm:mt-1 flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        "text-[11px] font-medium px-1.5 py-0.5 rounded-full",
                        netProfit >= 0
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {profitMargin.toFixed(1)}%
                      </span>
                      <ChangeBadge change={profitChange} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Mini stats row ─── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: t("balance.cardPercent"), value: `${paymentStats.cardPct}%`, icon: CreditCard },
            { label: t("balance.cashPercent"), value: `${paymentStats.cashPct}%`, icon: Banknote },
            { label: t("balance.stats.margin"), value: `${profitMargin.toFixed(0)}%`, icon: TrendingUp },
            { label: t("balance.stats.count"), value: `${stats.totalCount}`, icon: BarChart3 },
          ].map((kpi) => (
            <div key={kpi.label} className="flex items-center gap-2 rounded-xl bg-muted/40 px-2.5 py-2.5 sm:px-3.5">
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium tabular-nums text-foreground">{isLoading ? "–" : kpi.value}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{kpi.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ═══ Donut Chart ═══ */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Card className="border-border/30 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="h-72 sm:h-80 relative mx-auto max-w-[340px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : donutData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData.map((d) => ({
                            ...d,
                            // Boost outerRadius for selected slice
                            outerRadius: selectedSlice === d.name ? "96%" : (hoveredSlice?.name === d.name ? "93%" : "88%"),
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius="50%"
                          outerRadius="88%"
                          dataKey="value"
                          stroke="none"
                          paddingAngle={2}
                          animationBegin={200}
                          animationDuration={800}
                        >
                          {donutData.map((entry, i) => {
                            const isSelected = selectedSlice === entry.name;
                            const isHovered = hoveredSlice?.name === entry.name;
                            const isActive = isSelected || isHovered;
                            const isDimmed = (selectedSlice || hoveredSlice) && !isActive;
                            return (
                              <Cell
                                key={i}
                                fill={entry.color}
                                style={{
                                  cursor: "pointer",
                                  opacity: isDimmed ? 0.3 : 1,
                                  transform: isSelected ? "scale(1.06)" : isHovered ? "scale(1.03)" : "scale(1)",
                                  transformOrigin: "center",
                                  transition: "opacity 0.2s, transform 0.25s ease-out",
                                }}
                                onMouseEnter={() => setHoveredSlice(entry)}
                                onMouseLeave={() => setHoveredSlice(null)}
                                onClick={() => setSelectedSlice(prev => prev === entry.name ? null : entry.name)}
                              />
                            );
                          })}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      {(selectedSlice || hoveredSlice) ? (() => {
                        const active = donutData.find(d => d.name === (selectedSlice || hoveredSlice?.name));
                        if (!active) return null;
                        return (
                          <>
                            <div className="h-2.5 w-2.5 rounded-full mb-1" style={{ backgroundColor: active.color }} />
                            <span className="text-[10px] text-muted-foreground text-center px-4 truncate max-w-[75%]">{active.name}</span>
                            <span className="text-xl font-semibold">{formatCurrency(active.value)}</span>
                            <span className="text-[10px] text-muted-foreground">{donutTotal > 0 ? `${((active.value / donutTotal) * 100).toFixed(1)}%` : "0%"}</span>
                          </>
                        );
                      })() : (
                        <>
                          <span className="text-[10px] text-muted-foreground">{t("balance.netProfit")}</span>
                          <span className={cn("text-2xl sm:text-3xl font-semibold", netProfit >= 0 ? "text-emerald-600" : "text-destructive")}>
                            {profitMargin.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Legend — 2 columns, clickable */}
              {!isLoading && donutData.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                  {donutData.map((item) => {
                    const isActive = selectedSlice === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setSelectedSlice(prev => prev === item.name ? null : item.name)}
                        className={cn(
                          "flex items-center gap-2 text-xs min-w-0 rounded-xl px-2.5 py-2 transition-all text-left",
                          !isActive && "hover:bg-muted/50"
                        )}
                        style={{
                          backgroundColor: isActive ? `${item.color}18` : undefined,
                          boxShadow: isActive ? `inset 0 0 0 1.5px ${item.color}50` : undefined,
                        }}
                      >
                        <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 transition-transform", isActive && "scale-125")} style={{ backgroundColor: item.color }} />
                        <span className={cn("truncate", isActive ? "font-semibold" : "")} style={isActive ? { color: item.color } : undefined}>{item.name}</span>
                        <span className={cn("tabular-nums shrink-0 ml-auto", isActive ? "font-semibold" : "text-muted-foreground")} style={isActive ? { color: item.color } : undefined}>
                          {donutTotal > 0 ? `${((item.value / donutTotal) * 100).toFixed(0)}%` : "0%"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Detailed movements — colored bars like reference ═══ */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : groupedEntries.length === 0 ? (
            <Card className="border-border/30 shadow-sm">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">{t("balance.noEntries")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {groupedEntries.map(([key, group], groupIdx) => {
                const isRevenue = key === "__REVENUE__";
                const isExpanded = expandedCategories.has(key);
                const accentColor = isRevenue ? PROFIT_COLOR : CATEGORY_COLORS[groupIdx % CATEGORY_COLORS.length];

                return (
                  <div key={key}>
                    {/* Colored bar header */}
                    <button
                      onClick={() => toggleCategory(key)}
                      className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all"
                      style={{ backgroundColor: accentColor }}
                    >
                      <span className="text-sm font-medium text-white truncate">
                        {isRevenue ? t("balance.revenue").toUpperCase() : key}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-white/90 tabular-nums">
                          Tot: {formatCurrency(group.total)}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-white/80" />
                          : <ChevronDown className="h-4 w-4 text-white/80" />
                        }
                      </div>
                    </button>

                    {/* Expanded entries */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="py-1 px-2">
                            <div className="divide-y divide-border/20 bg-background rounded-lg">
                              {group.entries.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between py-2.5 px-3 gap-3">
                                  <div className="min-w-0 flex-1">
                                    {entry.description ? (
                                      <p className="text-xs font-normal text-foreground truncate">{entry.description}</p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">{entry.category}</p>
                                    )}
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <SourceIcon source={entry.source} />
                                      <span className="text-[10px] text-muted-foreground tabular-nums">
                                        {format(parseISO(entry.date), "dd MMM", { locale: it })}
                                      </span>
                                      {entry.source === "transaction" && (
                                        <Badge variant="secondary" className="text-[8px] px-1 py-0 font-normal h-3.5">POS</Badge>
                                      )}
                                      {entry.source === "appointment" && (
                                        <Badge variant="outline" className="text-[8px] px-1 py-0 border-emerald-400 text-emerald-600 font-normal h-3.5">{t("balance.appointment")}</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className={cn(
                                      "text-xs font-medium tabular-nums",
                                      entry.type === "income" ? "text-emerald-600" : "text-foreground"
                                    )}>
                                      {entry.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
                                    </span>
                                    {entry.isManual && (
                                      <div className="flex gap-0.5 ml-0.5">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEditEntry(entry as unknown as BalanceEntry); }}>
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteEntry.mutate(entry.id); }}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ═══ Annual Stacked Barchart ═══ */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Card className="border-border/30 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-foreground">{t("balance.annualOverview")}</h2>
              </div>
              <div className="h-52 sm:h-64">
                {annualQuery.isLoading ? <Skeleton className="h-full w-full rounded-lg" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(annualQuery.data ?? []).map(d => ({
                      ...d,
                      profitto: Math.max(0, d.entrate - d.costi),
                      profitPct: d.entrate > 0 ? Math.round(((d.entrate - d.costi) / d.entrate) * 100) : 0,
                    }))} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={0} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} width={40} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const label = name === "costi" ? t("balance.totalCosts") : name === "profitto" ? t("balance.netProfit") : name;
                          return [formatCurrency(value), label];
                        }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid hsl(var(--border))",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="costi" stackId="a" fill="hsl(340, 55%, 52%)" radius={[0, 0, 0, 0]} name="costi" />
                      <Bar dataKey="profitto" stackId="a" fill={PROFIT_COLOR} radius={[3, 3, 0, 0]} name="profitto" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PROFIT_COLOR }} />
                  <span className="text-muted-foreground">{t("balance.netProfit")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(340, 55%, 52%)" }} />
                  <span className="text-muted-foreground">{t("balance.totalCosts")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
        </TabsContent>

        <TabsContent value="cassa" className="mt-0">
          <CassaContent />
        </TabsContent>
      </Tabs>

      {/* ═══ New/Edit Entry Dialog ═══ */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? t("balance.editEntry") : t("balance.newEntry")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-normal">{t("balance.entryType")}</label>
              <Select value={entryType} onValueChange={(v) => { setEntryType(v as "income" | "expense"); setEntryCategory(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">{t("balance.tabs.income")}</SelectItem>
                  <SelectItem value="expense">{t("balance.tabs.expense")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-normal">{t("balance.category")}</label>
              <Select value={entryCategory} onValueChange={setEntryCategory}>
                <SelectTrigger><SelectValue placeholder={t("balance.selectCategory")} /></SelectTrigger>
                <SelectContent>
                  {currentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-normal">{t("balance.amount")}</label>
              <Input type="number" min="0" step="0.01" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-normal">{t("balance.date")}</label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-normal">{t("balance.description")}</label>
              <Input value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} placeholder={t("balance.descriptionPlaceholder")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSaveEntry} disabled={createEntry.isPending || updateEntry.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Categories Dialog ═══ */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("balance.manageCategories")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder={t("balance.categoryName")} className="flex-1" />
              <Select value={newCatType} onValueChange={(v) => setNewCatType(v as "income" | "expense")}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">{t("balance.tabs.income")}</SelectItem>
                  <SelectItem value="expense">{t("balance.tabs.expense")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                onClick={() => {
                  if (newCatName.trim()) {
                    createCategory.mutate({ name: newCatName.trim(), entry_type: newCatType });
                    setNewCatName("");
                  }
                }}
                disabled={createCategory.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant={c.entry_type === "income" ? "default" : "destructive"} className="text-[10px]">
                      {c.entry_type === "income" ? "+" : "-"}
                    </Badge>
                    <span className="text-sm">{c.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCategory.mutate(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
