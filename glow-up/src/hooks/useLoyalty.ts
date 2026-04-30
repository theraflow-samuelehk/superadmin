import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface LoyaltyPoint {
  id: string;
  user_id: string;
  client_id: string;
  transaction_id: string | null;
  points: number;
  reason: string;
  description: string | null;
  created_at: string;
}

export interface ClientPackage {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  service_id: string | null;
  total_sessions: number;
  used_sessions: number;
  price: number;
  expires_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  services?: { name: string } | null;
  clients?: { first_name: string; last_name: string } | null;
}

export interface GiftCard {
  id: string;
  user_id: string;
  code: string;
  initial_value: number;
  remaining_value: number;
  buyer_name: string | null;
  recipient_name: string | null;
  expires_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

const LOYALTY_LEVELS = [
  { key: "bronze", min: 0, label: "Bronze" },
  { key: "silver", min: 500, label: "Silver" },
  { key: "gold", min: 1500, label: "Gold" },
  { key: "vip", min: 5000, label: "VIP" },
];

export function getLoyaltyLevel(totalPoints: number) {
  return [...LOYALTY_LEVELS].reverse().find((l) => totalPoints >= l.min) || LOYALTY_LEVELS[0];
}

export function getNextLevel(totalPoints: number) {
  const current = getLoyaltyLevel(totalPoints);
  const idx = LOYALTY_LEVELS.findIndex((l) => l.key === current.key);
  return idx < LOYALTY_LEVELS.length - 1 ? LOYALTY_LEVELS[idx + 1] : null;
}

export const LOYALTY_LEVELS_CONFIG = LOYALTY_LEVELS;

export function useLoyalty(clientId?: string) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const pointsQuery = useQuery({
    queryKey: ["loyalty_points", tenantUserId, clientId],
    queryFn: async () => {
      let q = supabase.from("loyalty_points").select("*").eq("user_id", tenantUserId!).order("created_at", { ascending: false });
      if (clientId) q = q.eq("client_id", clientId);
      const { data, error } = await q;
      if (error) throw error;
      return data as LoyaltyPoint[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const addPoints = useMutation({
    mutationFn: async (input: { client_id: string; points: number; reason: string; description?: string; transaction_id?: string }) => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .insert({ ...input, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;

      // Update client total_points
      const { data: allPoints } = await supabase
        .from("loyalty_points")
        .select("points")
        .eq("client_id", input.client_id);
      const total = (allPoints || []).reduce((s, p) => s + p.points, 0);
      const level = getLoyaltyLevel(total);
      await supabase.from("clients").update({ total_points: total, loyalty_level: level.key }).eq("id", input.client_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty_points"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("loyalty.pointsAdded"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const editPoint = useMutation({
    mutationFn: async ({ id, points: pts, reason, description }: { id: string; points: number; reason: string; description?: string }) => {
      const { error } = await supabase
        .from("loyalty_points")
        .update({ points: pts, reason, description: description ?? null })
        .eq("id", id);
      if (error) throw error;

      // Recalc client total
      const point = pointsQuery.data?.find((p) => p.id === id);
      if (point) {
        const { data: allPoints } = await supabase
          .from("loyalty_points")
          .select("points")
          .eq("client_id", point.client_id);
        const total = (allPoints || []).reduce((s, p) => s + p.points, 0);
        const level = getLoyaltyLevel(total);
        await supabase.from("clients").update({ total_points: total, loyalty_level: level.key }).eq("id", point.client_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty_points"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("loyalty.pointsUpdated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deletePoint = useMutation({
    mutationFn: async (id: string) => {
      const point = pointsQuery.data?.find((p) => p.id === id);
      const { error } = await supabase.from("loyalty_points").delete().eq("id", id);
      if (error) throw error;

      // Recalc client total
      if (point) {
        const { data: allPoints } = await supabase
          .from("loyalty_points")
          .select("points")
          .eq("client_id", point.client_id);
        const total = (allPoints || []).reduce((s, p) => s + p.points, 0);
        const level = getLoyaltyLevel(total);
        await supabase.from("clients").update({ total_points: total, loyalty_level: level.key }).eq("id", point.client_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty_points"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("loyalty.pointsDeleted"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { points: pointsQuery.data ?? [], isLoading: pointsQuery.isLoading, addPoints, editPoint, deletePoint };
}

export function useClientPackages(clientId?: string) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const packagesQuery = useQuery({
    queryKey: ["client_packages", tenantUserId, clientId],
    queryFn: async () => {
      let q = supabase.from("client_packages").select("*, services(name), clients(first_name, last_name)").eq("user_id", tenantUserId!).order("created_at", { ascending: false });
      if (clientId) q = q.eq("client_id", clientId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ClientPackage[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createPackage = useMutation({
    mutationFn: async (input: { client_id: string; name: string; service_id?: string; total_sessions: number; price: number; expires_at?: string }) => {
      const { data, error } = await supabase
        .from("client_packages")
        .insert({ ...input, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_packages"] });
      toast.success(t("loyalty.packageCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const useSession = useMutation({
    mutationFn: async (packageId: string) => {
      const pkg = packagesQuery.data?.find((p) => p.id === packageId);
      if (!pkg || pkg.used_sessions >= pkg.total_sessions) throw new Error("No sessions remaining");
      const { error } = await supabase
        .from("client_packages")
        .update({ used_sessions: pkg.used_sessions + 1 })
        .eq("id", packageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_packages"] });
      toast.success(t("loyalty.sessionUsed"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    packages: packagesQuery.data ?? [],
    isLoading: packagesQuery.isLoading,
    createPackage,
    useSession,
  };
}

export function useGiftCards() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const cardsQuery = useQuery({
    queryKey: ["gift_cards", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .eq("user_id", tenantUserId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GiftCard[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createGiftCard = useMutation({
    mutationFn: async (input: { code: string; initial_value: number; buyer_name?: string; recipient_name?: string; expires_at?: string }) => {
      const { data, error } = await supabase
        .from("gift_cards")
        .insert({ ...input, remaining_value: input.initial_value, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift_cards"] });
      toast.success(t("loyalty.giftCardCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const redeemGiftCard = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const card = cardsQuery.data?.find((c) => c.id === id);
      if (!card || card.remaining_value < amount) throw new Error("Insufficient balance");
      const { error } = await supabase
        .from("gift_cards")
        .update({ remaining_value: card.remaining_value - amount })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift_cards"] });
      toast.success(t("loyalty.giftCardRedeemed"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    giftCards: cardsQuery.data ?? [],
    isLoading: cardsQuery.isLoading,
    createGiftCard,
    redeemGiftCard,
  };
}
