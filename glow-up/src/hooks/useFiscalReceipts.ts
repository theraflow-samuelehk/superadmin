import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface FiscalReceipt {
  id: string;
  receipt_number: string;
  receipt_date: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  payment_method: string;
  status: string;
  sent_to_ade: boolean;
  sent_at: string | null;
  salon_name: string | null;
  client_name: string | null;
  items: any;
  created_at: string;
}

export function useFiscalReceipts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<FiscalReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReceipts = async () => {
    try {
      const res = await supabase.functions.invoke("fiscal-receipt", {
        body: { action: "list" },
      });
      if (res.data?.receipts) {
        setReceipts(res.data.receipts);
      }
    } catch (error) {
      console.error("Fetch receipts error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchReceipts();
  }, [user]);

  const generateReceipt = async (transactionId: string, vatRate = 22) => {
    setGenerating(true);
    try {
      const res = await supabase.functions.invoke("fiscal-receipt", {
        body: { action: "generate", transactionId, vatRate },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as { receipt?: FiscalReceipt; error?: string };

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      if (data.receipt) {
        setReceipts((prev) => [data.receipt!, ...prev]);
        toast.success(t("fiscal.receiptGenerated"));
        return data.receipt;
      }
    } catch (error) {
      console.error("Generate receipt error:", error);
      toast.error(error instanceof Error ? error.message : "Errore generazione ricevuta");
    } finally {
      setGenerating(false);
    }
    return null;
  };

  const markAsSent = async (receiptId: string) => {
    try {
      const res = await supabase.functions.invoke("fiscal-receipt", {
        body: { action: "mark-sent", receiptId },
      });

      if (res.data?.success) {
        setReceipts((prev) =>
          prev.map((r) =>
            r.id === receiptId
              ? { ...r, sent_to_ade: true, sent_at: new Date().toISOString(), status: "sent" }
              : r
          )
        );
        toast.success(t("fiscal.markedAsSent"));
      }
    } catch (error) {
      console.error("Mark sent error:", error);
      toast.error("Errore");
    }
  };

  return { receipts, loading, generating, generateReceipt, markAsSent, refetch: fetchReceipts };
}
