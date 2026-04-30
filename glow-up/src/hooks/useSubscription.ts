import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_operators: number;
  max_clients: number | null;
  features: any;
  sort_order: number;
}

interface Subscription {
  id: string;
  status: string;
  billing_period: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan: Plan;
}

export function useSubscription() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("sort_order");
      setPlans(data || []);
    };

    const fetchSubscription = async () => {
      if (!user || !tenantUserId) {
        setSubscription(null);
        setTrialEndsAt(null);
        if (!user) setLoading(false);
        return;
      }

      // Fetch trial_ends_at from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at")
        .eq("user_id", tenantUserId)
        .maybeSingle();

      setTrialEndsAt((profile as any)?.trial_ends_at || null);

      const { data } = await supabase
        .from("subscriptions")
        .select("id, status, billing_period, current_period_end, cancel_at_period_end, plan_id")
        .eq("user_id", tenantUserId)
        .is("deleted_at", null)
        .eq("status", "active")
        .maybeSingle();

      if (data) {
        const { data: plan } = await supabase
          .from("plans")
          .select("*")
          .eq("id", data.plan_id)
          .single();

        if (plan) {
          setSubscription({ ...data, plan } as Subscription);
        }
      } else {
        setSubscription(null);
      }
      setLoading(false);
    };

    fetchPlans();
    fetchSubscription();
  }, [user, tenantUserId]);

  const now = new Date();
  const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
  const isTrialExpired = !subscription && !!trialEnd && trialEnd < now;
  const daysLeft = trialEnd && !subscription
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return { subscription, plans, loading, isTrialExpired, trialEndsAt, daysLeft };
}
