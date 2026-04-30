import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "gift_card";
export type TransactionStatus = "completed" | "refunded" | "voided";

export interface TransactionItem {
  name: string;
  price: number;
  qty: number;
  service_id?: string;
  product_id?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  client_id: string | null;
  appointment_id: string | null;
  items: TransactionItem[];
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: { first_name: string; last_name: string } | null;
}

export interface TransactionInsert {
  client_id?: string | null;
  appointment_id?: string | null;
  items: TransactionItem[];
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  payment_method: PaymentMethod;
  notes?: string;
}

export function useTransactions(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["transactions", tenantUserId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*, clients(first_name, last_name)")
        .eq("user_id", tenantUserId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (dateRange?.from) query = query.gte("created_at", dateRange.from);
      if (dateRange?.to) query = query.lte("created_at", dateRange.to);

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as Transaction[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createTransaction = useMutation({
    mutationFn: async (tx: TransactionInsert) => {
      const payload = {
        client_id: tx.client_id,
        appointment_id: tx.appointment_id,
        items: JSON.parse(JSON.stringify(tx.items)),
        subtotal: tx.subtotal,
        discount_percent: tx.discount_percent,
        discount_amount: tx.discount_amount,
        total: tx.total,
        payment_method: tx.payment_method,
        notes: tx.notes,
        user_id: tenantUserId!,
      };
      const { data, error } = await supabase
        .from("transactions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(t("pos.transactionCompleted"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const voidTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "voided" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(t("pos.transactionVoided"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const todaySummary = useMemo(() => {
    const txs = transactionsQuery.data?.filter((tx) => tx.status === "completed") ?? [];
    const totalCash = txs.filter((tx) => tx.payment_method === "cash").reduce((s, tx) => s + Number(tx.total), 0);
    const totalCard = txs.filter((tx) => tx.payment_method === "card").reduce((s, tx) => s + Number(tx.total), 0);
    const totalOther = txs.filter((tx) => !["cash", "card"].includes(tx.payment_method)).reduce((s, tx) => s + Number(tx.total), 0);
    return { totalCash, totalCard, totalOther, grandTotal: totalCash + totalCard + totalOther, count: txs.length };
  }, [transactionsQuery.data]);

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    createTransaction,
    voidTransaction,
    todaySummary,
  };
}
