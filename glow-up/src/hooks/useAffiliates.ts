import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Affiliate {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  commission_pct: number;
  is_manager: boolean;
  manager_id: string | null;
  team_commission_pct: number | null;
  created_at: string;
  deleted_at: string | null;
  created_by: string | null;
}

export interface AffiliateClient {
  id: string;
  affiliate_id: string;
  retailer_user_id: string;
  assigned_at: string;
  assigned_by: string | null;
  // joined
  salon_name?: string | null;
  display_name?: string | null;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  retailer_user_id: string;
  subscription_id: string | null;
  payment_amount: number;
  commission_pct: number;
  commission_amount: number;
  is_manager_share: boolean;
  parent_commission_id: string | null;
  created_at: string;
  status: string;
  // joined
  salon_name?: string | null;
}

export function useAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAffiliates((data as any[]) || []);
    } catch (e) {
      console.error("Failed to fetch affiliates:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  const createAffiliate = async (data: {
    first_name: string;
    last_name: string;
    email: string;
    commission_pct: number;
    is_manager: boolean;
    manager_id?: string | null;
    team_commission_pct?: number | null;
  }) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data: affiliate, error } = await supabase
      .from("affiliates")
      .insert({
        ...data,
        created_by: user.user.id,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Errore nella creazione dell'affiliato");
      console.error(error);
      return null;
    }

    await fetchAffiliates();
    return affiliate;
  };

  const createInvite = async (affiliateId: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data: invite, error } = await supabase
      .from("affiliate_invites")
      .insert({
        affiliate_id: affiliateId,
        created_by: user.user.id,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Errore nella creazione dell'invito");
      console.error(error);
      return null;
    }

    return invite;
  };

  const fetchAffiliateClients = async (affiliateId: string): Promise<AffiliateClient[]> => {
    const { data, error } = await supabase
      .from("affiliate_clients")
      .select("*")
      .eq("affiliate_id", affiliateId);

    if (error) {
      console.error(error);
      return [];
    }

    // Enrich with profile data
    const userIds = (data as any[]).map((d: any) => d.retailer_user_id);
    if (userIds.length === 0) return data as any[];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, salon_name, display_name")
      .in("user_id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.user_id] = p;
    });

    return (data as any[]).map((d: any) => ({
      ...d,
      salon_name: profileMap[d.retailer_user_id]?.salon_name,
      display_name: profileMap[d.retailer_user_id]?.display_name,
    }));
  };

  const assignClient = async (affiliateId: string, retailerUserId: string) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("affiliate_clients")
      .insert({
        affiliate_id: affiliateId,
        retailer_user_id: retailerUserId,
        assigned_by: user.user?.id,
      } as any);

    if (error) {
      if (error.code === "23505") {
        toast.error("Cliente già assegnato a questo affiliato");
      } else {
        toast.error("Errore nell'assegnazione");
        console.error(error);
      }
      return false;
    }
    return true;
  };

  const removeClient = async (assignmentId: string) => {
    const { error } = await supabase
      .from("affiliate_clients")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toast.error("Errore nella rimozione");
      console.error(error);
      return false;
    }
    return true;
  };

  const fetchCommissions = async (affiliateId: string): Promise<AffiliateCommission[]> => {
    const { data, error } = await supabase
      .from("affiliate_commissions")
      .select("*")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    // Enrich with profile data
    const userIds = [...new Set((data as any[]).map((d: any) => d.retailer_user_id))];
    if (userIds.length === 0) return data as any[];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, salon_name, display_name")
      .in("user_id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.user_id] = p;
    });

    return (data as any[]).map((d: any) => ({
      ...d,
      salon_name: profileMap[d.retailer_user_id]?.salon_name || profileMap[d.retailer_user_id]?.display_name,
    }));
  };

  const fetchTeamMembers = async (managerId: string): Promise<Affiliate[]> => {
    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .eq("manager_id", managerId)
      .is("deleted_at", null);

    if (error) {
      console.error(error);
      return [];
    }
    return (data as any[]) || [];
  };

  return {
    affiliates,
    loading,
    fetchAffiliates,
    createAffiliate,
    createInvite,
    fetchAffiliateClients,
    assignClient,
    removeClient,
    fetchCommissions,
    fetchTeamMembers,
  };
}
