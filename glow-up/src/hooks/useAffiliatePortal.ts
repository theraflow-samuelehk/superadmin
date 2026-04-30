import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AffiliatePortalData {
  affiliate: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    commission_pct: number;
    is_manager: boolean;
    team_commission_pct: number | null;
    manager_id: string | null;
  };
  clients: Array<{
    id: string;
    retailer_user_id: string;
    assigned_at: string;
    salon_name: string;
    subscriptions: Array<{
      id: string;
      status: string;
      billing_period: string;
      current_period_start: string | null;
      current_period_end: string | null;
      plan: { id: string; name: string; price_monthly: number; price_yearly: number | null } | null;
    }>;
  }>;
  commissions: Array<{
    id: string;
    retailer_user_id: string;
    subscription_id: string | null;
    payment_amount: number;
    commission_pct: number;
    commission_amount: number;
    is_manager_share: boolean;
    parent_commission_id: string | null;
    status: string;
    created_at: string;
    retailer_name: string;
  }>;
  team_members: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    commission_pct: number;
    team_commission_pct: number | null;
    clients: Array<{ id: string; retailer_user_id: string; assigned_at: string }>;
  }>;
  team_commissions: Array<{
    id: string;
    affiliate_id: string;
    commission_amount: number;
    status: string;
    created_at: string;
  }>;
}

function buildUrl(action: string) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/affiliate-portal?action=${action}`;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
  };
}

export function useAffiliatePortal() {
  const { session } = useAuth();
  const [data, setData] = useState<AffiliatePortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(buildUrl("my-data"), {
        headers: authHeaders(session.access_token),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || "unknown_error");
      } else {
        setData(json);
      }
    } catch {
      setError("network_error");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: refresh on commission changes
  useEffect(() => {
    if (!data?.affiliate?.id) return;

    const channel = supabase
      .channel("affiliate-commissions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "affiliate_commissions",
          filter: `affiliate_id=eq.${data.affiliate.id}`,
        },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [data?.affiliate?.id, fetchData]);

  // ── Team management actions ──

  const createTeamMember = useCallback(async (payload: {
    first_name: string;
    last_name: string;
    email: string;
    commission_pct: number;
    team_commission_pct: number | null;
  }) => {
    if (!session?.access_token) throw new Error("No session");
    const res = await fetch(buildUrl("create-team-member"), {
      method: "POST",
      headers: authHeaders(session.access_token),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "create_failed");
    await fetchData();
    return json as { affiliate: any; invite_token: string };
  }, [session?.access_token, fetchData]);

  const createTeamInvite = useCallback(async (affiliateId: string) => {
    if (!session?.access_token) throw new Error("No session");
    const res = await fetch(buildUrl("create-team-invite"), {
      method: "POST",
      headers: authHeaders(session.access_token),
      body: JSON.stringify({ affiliate_id: affiliateId }),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "invite_failed");
    return json as { token: string };
  }, [session?.access_token]);

  const assignClientToMember = useCallback(async (affiliateId: string, retailerUserId: string) => {
    if (!session?.access_token) throw new Error("No session");
    const res = await fetch(buildUrl("assign-client-to-member"), {
      method: "POST",
      headers: authHeaders(session.access_token),
      body: JSON.stringify({ affiliate_id: affiliateId, retailer_user_id: retailerUserId }),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "assign_failed");
    await fetchData();
    return json;
  }, [session?.access_token, fetchData]);

  return { data, isLoading, error, refetch: fetchData, createTeamMember, createTeamInvite, assignClientToMember };
}
