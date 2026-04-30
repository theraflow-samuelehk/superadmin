import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PortalData {
  client: {
    id: string;
    first_name: string;
    last_name: string;
    total_points: number;
    loyalty_level: string;
  };
  salon: {
    name: string;
    opening_hours: any;
    phone: string | null;
    address: string | null;
    user_id: string;
    loyalty_enabled: boolean;
    shop_slug: string | null;
    tutorials_enabled: boolean;
    booking_blocked_from: string | null;
    booking_blocked_until: string | null;
    booking_blocked_message: string | null;
  };
  services: Array<{ id: string; name: string; duration_minutes: number; price: number; category_id: string | null }>;
  categories: Array<{ id: string; name: string; emoji: string | null }>;
  operators: Array<{ id: string; name: string; specializations: string[] | null; calendar_color: string; photo_url: string | null; service_ids: string[] | null }>;
  appointments: Array<{
    id: string; start_time: string; end_time: string; status: string;
    notes: string | null; service_id: string; operator_id: string; reminder_sent: boolean;
    package_id: string | null;
  }>;
  loyalty_points: Array<{ id: string; points: number; reason: string; description: string | null; created_at: string }>;
  packages: Array<{
    id: string; name: string; total_sessions: number; used_sessions: number;
    price: number; expires_at: string | null; service_id: string | null; status: string;
  }>;
  treatment_cards: Array<{
    id: string; threshold: number; stamps_count: number; completed_cycles: number;
    reward_type: string; reward_service_id: string | null; is_active: boolean;
    discount_pct?: number;
    services?: { name: string } | null;
  }>;
  photos: Array<{
    id: string; photo_url: string; photo_type: string; notes: string | null;
    taken_at: string; gdpr_consent: boolean;
  }>;
}

const PORTAL_QUERY_KEY = "client-portal-data";

export function useClientPortal() {
  const { session, roles, refreshRoles } = useAuth();
  const isClient = roles.includes("client");
  const queryClient = useQueryClient();

  const portalQuery = useQuery<PortalData>({
    queryKey: [PORTAL_QUERY_KEY, session?.access_token],
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 min — data is fresh for a while
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!roles.includes("client")) {
        await refreshRoles();
      }
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/client-portal?action=my-data`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch portal data");
      return res.json();
    },
    enabled: !!session && isClient,
  });

  const fetchSlots = async (date: string, operatorId: string, duration: number, salonUserId: string, serviceId?: string, excludeAppointmentId?: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    let url = `https://${projectId}.supabase.co/functions/v1/client-portal?action=slots&date=${date}&operator_id=${operatorId}&duration=${duration}&salon_user_id=${salonUserId}${serviceId ? `&service_id=${serviceId}` : ''}`;
    if (excludeAppointmentId) url += `&exclude_appointment_id=${excludeAppointmentId}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch slots");
    const data = await res.json();
    return data as { slots: string[]; slot_operators?: Record<string, string> };
  };

  // Helper to optimistically update the portal cache
  const updateCache = (updater: (old: PortalData) => PortalData) => {
    queryClient.setQueriesData<PortalData>(
      { queryKey: [PORTAL_QUERY_KEY] },
      (old) => old ? updater(old) : old
    );
  };

  // Background sync — silently refetch without blocking UI
  const backgroundSync = () => {
    setTimeout(() => portalQuery.refetch(), 1500);
  };

  const bookAppointment = async (serviceId: string, operatorId: string, startTime: string, packageId?: string, excludeAppointmentId?: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/client-portal?action=book-appointment`;
    const bodyPayload: Record<string, string> = { service_id: serviceId, operator_id: operatorId, start_time: startTime };
    if (packageId) bodyPayload.package_id = packageId;
    if (excludeAppointmentId) bodyPayload.exclude_appointment_id = excludeAppointmentId;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "booking_failed");
    }

    // Optimistic cache update — add new appointment + update package
    const apt = data.appointment as { id: string; start_time: string; end_time: string; operator_id: string; service_id: string; package_id?: string | null } | undefined;
    if (apt) {
      updateCache((old) => {
        const newAppointments = [
          { ...apt, status: "confirmed", notes: null, reminder_sent: false, package_id: apt.package_id ?? packageId ?? null },
          ...old.appointments,
        ];
        let newPackages = old.packages;
        if (packageId) {
          newPackages = old.packages.map(p => {
            if (p.id !== packageId) return p;
            const newUsed = p.used_sessions + 1;
            return { ...p, used_sessions: newUsed, status: newUsed >= p.total_sessions ? "completed" : "active" };
          });
        }
        return { ...old, appointments: newAppointments, packages: newPackages };
      });
    }

    backgroundSync();
    return apt;
  };

  const cancelAppointment = async (appointmentId: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/client-portal?action=cancel-appointment`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appointmentId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "cancel_failed");
    }

    // Optimistic: mark as cancelled + rollback package session
    updateCache((old) => {
      const cancelledApt = old.appointments.find(a => a.id === appointmentId);
      let newPackages = old.packages;
      // If the cancelled appointment used a package, rollback the session
      if (cancelledApt) {
        const aptAny = cancelledApt as any;
        if (aptAny.package_id) {
          newPackages = old.packages.map(p => {
            if (p.id !== aptAny.package_id) return p;
            const newUsed = Math.max(0, p.used_sessions - 1);
            return { ...p, used_sessions: newUsed, status: newUsed >= p.total_sessions ? "completed" : "active" };
          });
        }
      }
      return {
        ...old,
        appointments: old.appointments.map(a =>
          a.id === appointmentId ? { ...a, status: "cancelled" } : a
        ),
        packages: newPackages,
      };
    });

    backgroundSync();
  };

  const confirmAppointment = async (appointmentId: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/client-portal?action=confirm-appointment`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appointmentId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "confirm_failed");
    }

    // Optimistic: mark as confirmed
    updateCache((old) => ({
      ...old,
      appointments: old.appointments.map(a =>
        a.id === appointmentId ? { ...a, client_confirmed: true } : a
      ),
    }));

    backgroundSync();
  };

  return {
    data: portalQuery.data,
    isLoading: portalQuery.isLoading,
    error: portalQuery.error,
    refetch: portalQuery.refetch,
    fetchSlots,
    bookAppointment,
    cancelAppointment,
    confirmAppointment,
  };
}
