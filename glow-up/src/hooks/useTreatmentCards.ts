import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface TreatmentCard {
  id: string;
  user_id: string;
  client_id: string;
  threshold: number;
  reward_type: string;
  reward_service_id: string | null;
  discount_pct: number;
  stamps_count: number;
  completed_cycles: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  clients?: { first_name: string; last_name: string } | null;
  services?: { name: string } | null;
}

export function useTreatmentCards() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const cardsQuery = useQuery({
    queryKey: ["treatment_cards", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_cards")
        .select("*, clients(first_name, last_name), services(name)")
        .eq("user_id", tenantUserId!)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TreatmentCard[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createCard = useMutation({
    mutationFn: async (input: { client_id: string; threshold: number; reward_type: string; reward_service_id?: string; discount_pct?: number }) => {
      const { data, error } = await supabase
        .from("treatment_cards")
        .insert({ ...input, user_id: tenantUserId! })
        .select("*, clients(first_name, last_name), services(name)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment_cards"] });
      toast.success(t("loyalty.cardCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; threshold?: number; reward_type?: string; reward_service_id?: string | null; discount_pct?: number }) => {
      const { error } = await supabase
        .from("treatment_cards")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment_cards"] });
      toast.success(t("loyalty.cardUpdated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treatment_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment_cards"] });
      toast.success(t("loyalty.cardDeleted"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addStamp = useMutation({
    mutationFn: async (cardId: string) => {
      const card = cardsQuery.data?.find((c) => c.id === cardId);
      if (!card) throw new Error("Card not found");

      const newStamps = card.stamps_count + 1;
      if (newStamps >= card.threshold) {
        const { error } = await supabase
          .from("treatment_cards")
          .update({ stamps_count: 0, completed_cycles: card.completed_cycles + 1 })
          .eq("id", cardId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("treatment_cards")
          .update({ stamps_count: newStamps })
          .eq("id", cardId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment_cards"] });
      toast.success(t("loyalty.stampAdded"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeStamp = useMutation({
    mutationFn: async (cardId: string) => {
      const card = cardsQuery.data?.find((c) => c.id === cardId);
      if (!card) throw new Error("Card not found");

      if (card.stamps_count > 0) {
        const { error } = await supabase
          .from("treatment_cards")
          .update({ stamps_count: card.stamps_count - 1 })
          .eq("id", cardId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment_cards"] });
    },
    onError: (err: Error) => console.warn("Remove stamp error:", err.message),
  });

  return {
    cards: cardsQuery.data ?? [],
    isLoading: cardsQuery.isLoading,
    createCard,
    updateCard,
    deleteCard,
    addStamp,
    removeStamp,
  };
}
