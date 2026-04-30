import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export interface PortalAppointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  service_id: string;
  operator_id: string;
  client_id: string;
}

export interface PortalColleague {
  id: string;
  name: string;
  role: string | null;
  specializations: string[] | null;
  calendar_color?: string;
}

export interface OperatorPortalData {
  operator: {
    id: string;
    name: string;
    role: string | null;
    portal_permissions: Record<string, boolean>;
  };
  salon: {
    name: string;
    opening_hours: any;
    user_id: string;
  };
  appointments: PortalAppointment[];
  allAppointments: PortalAppointment[];
  services: Array<{ id: string; name: string; duration_minutes: number; price: number }>;
  clients: Array<{ id: string; first_name: string; last_name: string }>;
  colleagues: PortalColleague[];
}

export function useOperatorPortal() {
  const { session, roles } = useAuth();
  const isOperator = roles.includes("operator");

  const portalQuery = useQuery<OperatorPortalData>({
    queryKey: ["operator-portal-data"],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/operator-portal?action=my-data`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch operator portal data");
      return res.json();
    },
    enabled: !!session && isOperator,
  });

  return {
    data: portalQuery.data,
    isLoading: portalQuery.isLoading,
    error: portalQuery.error,
    refetch: portalQuery.refetch,
  };
}
