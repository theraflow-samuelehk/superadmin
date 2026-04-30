import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { useSalonName } from "@/hooks/useSalonName";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { buildWhatsAppUrl, buildSmsUrl, buildAppointmentActionUrl, renderTemplate } from "@/components/reminder/reminderUtils";
import { DEFAULT_WA_TEMPLATES, DEFAULT_SMS_TEMPLATES } from "@/components/reminder/ReminderConfigPanel";

interface AppointmentData {
  id: string;
  short_code?: string;
  start_time: string;
  end_time: string;
  contact_phone?: string | null;
  client_id?: string | null;
}

interface SendParams {
  clientName: string;
  serviceName: string;
  phone: string;
  duration?: string;
}

/**
 * Builds confirmation WA/SMS URLs using the salon's configured templates.
 */
export function useConfirmationMessage() {
  const { tenantUserId } = useTenantUserId();
  const salonName = useSalonName();

  const { data: config } = useQuery({
    queryKey: ["manual-reminder-config-for-confirm", tenantUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("manual_reminder_config")
        .select("wa_templates, sms_templates")
        .eq("user_id", tenantUserId!)
        .maybeSingle();
      return data;
    },
    enabled: !!tenantUserId,
    staleTime: 5 * 60 * 1000,
  });

  const waConfirmationTemplate = (() => {
    const stored = config?.wa_templates as any;
    if (stored?.confirmation) return stored.confirmation;
    return DEFAULT_WA_TEMPLATES.confirmation;
  })();

  const smsConfirmationTemplate = (() => {
    const stored = config?.sms_templates as any;
    if (stored?.confirmation) return stored.confirmation;
    return DEFAULT_SMS_TEMPLATES.confirmation;
  })();

  const buildConfirmationUrls = (apt: AppointmentData, params: SendParams) => {
    const aptDate = new Date(apt.start_time);
    const startTime = new Date(apt.start_time);
    const endTime = new Date(apt.end_time);
    const calcDuration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    const vars: Record<string, string> = {
      client_name: params.clientName,
      salon_name: salonName,
      service_name: params.serviceName,
      date: format(aptDate, "EEEE d MMMM", { locale: it }),
      short_data: format(aptDate, "EEE, d MMM", { locale: it }),
      time: format(aptDate, "HH:mm"),
      day_label: "oggi",
      link: buildAppointmentActionUrl(apt.short_code || apt.id),
      duration: params.duration || (calcDuration > 0 ? String(calcDuration) : ""),
    };

    const waMsg = renderTemplate(waConfirmationTemplate, vars);
    const smsMsg = renderTemplate(smsConfirmationTemplate, vars);

    return {
      waUrl: buildWhatsAppUrl(params.phone, waMsg),
      smsUrl: buildSmsUrl(params.phone, smsMsg),
    };
  };

  return { buildConfirmationUrls };
}
