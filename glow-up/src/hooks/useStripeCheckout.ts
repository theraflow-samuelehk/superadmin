import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const checkout = async (planId: string, billingPeriod: "monthly" | "yearly" = "monthly", discountCode?: string, withTrial?: boolean) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non autenticato");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            planId,
            billingPeriod,
            discountCode: discountCode || undefined,
            withTrial: withTrial || false,
            successUrl: `${window.location.origin}/pricing?success=true`,
            cancelUrl: `${window.location.origin}/pricing?canceled=true`,
          }),
        }
      );

      const data = (await response.json()) as { url?: string; error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || data.message || "Errore durante il checkout");
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Errore durante il checkout");
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    setPortalLoading(true);
    try {
      const res = await supabase.functions.invoke("stripe-portal", {
        body: { action: "cancel" },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as { success?: boolean; error?: string };

      if (data.error) {
        toast.error(data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(error instanceof Error ? error.message : "Errore durante la cancellazione");
      return false;
    } finally {
      setPortalLoading(false);
    }
  };

  const reactivateSubscription = async (): Promise<boolean> => {
    setPortalLoading(true);
    try {
      const res = await supabase.functions.invoke("stripe-portal", {
        body: { action: "reactivate" },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as { success?: boolean; error?: string };

      if (data.error) {
        toast.error(data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Reactivate error:", error);
      toast.error(error instanceof Error ? error.message : "Errore durante la riattivazione");
      return false;
    } finally {
      setPortalLoading(false);
    }
  };

  return { checkout, loading, cancelSubscription, reactivateSubscription, portalLoading };
}
