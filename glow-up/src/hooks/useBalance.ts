import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface BalanceEntry {
  id: string;
  user_id: string;
  entry_type: "income" | "expense";
  category: string;
  amount: number;
  entry_date: string;
  description: string | null;
  source: string;
  reference_id: string | null;
  created_at: string;
}

export interface BalanceCategory {
  id: string;
  user_id: string;
  name: string;
  entry_type: "income" | "expense";
  created_at: string;
}

interface BalanceEntryInsert {
  entry_type: "income" | "expense";
  category: string;
  amount: number;
  entry_date: string;
  description?: string;
}

const DEFAULT_CATEGORIES: { name: string; entry_type: "income" | "expense" }[] = [
  { name: "Vendita servizi", entry_type: "income" },
  { name: "Vendita prodotti", entry_type: "income" },
  { name: "Altro", entry_type: "income" },
  { name: "Affitto", entry_type: "expense" },
  { name: "Stipendi", entry_type: "expense" },
  { name: "Forniture", entry_type: "expense" },
  { name: "Utenze", entry_type: "expense" },
  { name: "Altro", entry_type: "expense" },
];

export function useBalance(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch manual entries
  const entriesQuery = useQuery({
    queryKey: ["balance_entries", tenantUserId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let query = supabase
        .from("balance_entries")
        .select("*")
        .eq("user_id", tenantUserId!)
        .order("entry_date", { ascending: false });

      if (dateRange?.from) query = query.gte("entry_date", dateRange.from);
      if (dateRange?.to) query = query.lte("entry_date", dateRange.to);

      const { data, error } = await query;
      if (error) throw error;
      return data as BalanceEntry[];
    },
    enabled: !!user && !!tenantUserId,
  });

  // Fetch completed transactions for auto income
  const transactionsQuery = useQuery({
    queryKey: ["transactions", "balance", tenantUserId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("id, total, created_at, items, payment_method, status, appointment_id, client_id, clients(first_name, last_name)")
        .eq("user_id", tenantUserId!)
        .eq("status", "completed")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (dateRange?.from) query = query.gte("created_at", new Date(`${dateRange.from}T00:00:00`).toISOString());
      if (dateRange?.to) query = query.lte("created_at", new Date(`${dateRange.to}T23:59:59`).toISOString());

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!tenantUserId,
  });

  // Fetch active appointments (confirmed/in_progress/completed) for auto income
  // Exclude package-linked appointments (already paid at purchase)
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "balance", tenantUserId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select("id, start_time, service_id, client_id, status, package_id, services(name, price), clients(first_name, last_name)")
        .eq("user_id", tenantUserId!)
        .in("status", ["confirmed", "in_progress", "completed"])
        .is("deleted_at", null)
        .is("package_id", null)
        .lte("start_time", new Date().toISOString())
        .order("start_time", { ascending: false });

      if (dateRange?.from) query = query.gte("start_time", new Date(`${dateRange.from}T00:00:00`).toISOString());
      if (dateRange?.to) query = query.lte("start_time", new Date(`${dateRange.to}T23:59:59`).toISOString());

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!tenantUserId,
  });

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ["balance_categories", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balance_categories")
        .select("*")
        .eq("user_id", tenantUserId!)
        .order("name");
      if (error) throw error;

      // Seed defaults if empty
      if (data.length === 0 && tenantUserId) {
        const inserts = DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          user_id: tenantUserId!,
        }));
        const { data: seeded, error: seedErr } = await supabase
          .from("balance_categories")
          .insert(inserts)
          .select();
        if (seedErr) throw seedErr;
        return seeded as BalanceCategory[];
      }

      return data as BalanceCategory[];
    },
    enabled: !!user && !!tenantUserId,
  });

  // CRUD mutations
  const createEntry = useMutation({
    mutationFn: async (entry: BalanceEntryInsert) => {
      const { error } = await supabase.from("balance_entries").insert({
        ...entry,
        user_id: tenantUserId!,
        source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance_entries"] });
      toast.success(t("balance.entrySaved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...data }: BalanceEntryInsert & { id: string }) => {
      const { error } = await supabase
        .from("balance_entries")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance_entries"] });
      toast.success(t("balance.entryUpdated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("balance_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance_entries"] });
      toast.success(t("balance.entryDeleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createCategory = useMutation({
    mutationFn: async (cat: { name: string; entry_type: "income" | "expense" }) => {
      const { error } = await supabase.from("balance_categories").insert({
        ...cat,
        user_id: tenantUserId!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance_categories"] });
      toast.success(t("balance.categoryCreated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("balance_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance_categories"] });
      toast.success(t("balance.categoryDeleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Build set of appointment IDs that already have a completed transaction (to avoid double counting)
  const txAppointmentIds = useMemo(() => {
    const ids = new Set<string>();
    (transactionsQuery.data ?? []).forEach((tx) => {
      if (tx.appointment_id) ids.add(tx.appointment_id);
    });
    return ids;
  }, [transactionsQuery.data]);

  // Filter appointments: exclude those already counted via transactions
  const filteredAppointments = useMemo(() => {
    return (appointmentsQuery.data ?? []).filter((apt) => !txAppointmentIds.has(apt.id));
  }, [appointmentsQuery.data, txAppointmentIds]);

  // Calculations
  const stats = useMemo(() => {
    const entries = entriesQuery.data ?? [];
    const txs = transactionsQuery.data ?? [];

    const txIncome = txs.reduce((s, tx) => s + Number(tx.total), 0);
    const manualIncome = entries
      .filter((e) => e.entry_type === "income")
      .reduce((s, e) => s + Number(e.amount), 0);
    const expenseTotal = entries
      .filter((e) => e.entry_type === "expense")
      .reduce((s, e) => s + Number(e.amount), 0);

    const appointmentIncome = filteredAppointments.reduce((s, apt) => {
      const price = (apt.services as any)?.price ?? 0;
      return s + Number(price);
    }, 0);

    const incomeTotal = txIncome + manualIncome + appointmentIncome;
    const balance = incomeTotal - expenseTotal;
    const margin = incomeTotal > 0 ? ((balance / incomeTotal) * 100) : 0;

    // Count entries + transactions + appointments
    const totalCount = entries.length + txs.length + filteredAppointments.length;

    // Avg daily
    let avgDaily = 0;
    if (dateRange?.from && dateRange?.to) {
      const days = Math.max(
        1,
        Math.ceil(
          (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      avgDaily = balance / days;
    }

    return { incomeTotal, expenseTotal, balance, margin, totalCount, avgDaily, txIncome, manualIncome, appointmentIncome };
  }, [entriesQuery.data, transactionsQuery.data, filteredAppointments, dateRange]);

  // Build unified list for display
  const allEntries = useMemo(() => {
    const manual = (entriesQuery.data ?? []).map((e) => ({
      id: e.id,
      type: e.entry_type as "income" | "expense",
      category: e.category,
      amount: Number(e.amount),
      date: e.entry_date,
      description: e.description,
      source: e.source,
      isManual: true,
    }));

    const auto = (transactionsQuery.data ?? []).map((tx) => {
      const client = tx.clients as any;
      const items = (tx.items as any[]) ?? [];
      const itemsSummary = items.map((i: any) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ");
      const clientName = client ? `${client.first_name} ${client.last_name}` : null;
      const desc = [clientName, itemsSummary].filter(Boolean).join(" · ");
      return {
        id: tx.id,
        type: "income" as const,
        category: t(`pos.method.${tx.payment_method}`),
        amount: Number(tx.total),
        date: tx.created_at.split("T")[0],
        description: desc || null,
        source: "transaction",
        isManual: false,
      };
    });

    const appointments = filteredAppointments.map((apt) => {
      const svc = apt.services as any;
      const client = apt.clients as any;
      const desc = [svc?.name, client ? `${client.first_name} ${client.last_name}` : null].filter(Boolean).join(" · ");
      return {
        id: apt.id,
        type: "income" as const,
        category: "Appuntamento",
        amount: Number(svc?.price ?? 0),
        date: apt.start_time.split("T")[0],
        description: desc || null,
        source: "appointment",
        isManual: false,
      };
    });

    return [...manual, ...auto, ...appointments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entriesQuery.data, transactionsQuery.data, filteredAppointments]);

  return {
    entries: entriesQuery.data ?? [],
    transactions: transactionsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    allEntries,
    stats,
    isLoading: entriesQuery.isLoading || transactionsQuery.isLoading || appointmentsQuery.isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    createCategory,
    deleteCategory,
  };
}
