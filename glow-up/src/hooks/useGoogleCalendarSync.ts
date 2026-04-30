import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useGoogleCalendarSync() {
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);

  const syncAppointment = async (appointmentId: string) => {
    setSyncing(true);
    try {
      const res = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "sync-appointment", appointmentId },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as { success?: boolean; error?: string };

      if (data.error) {
        toast.error(data.error);
        return false;
      }

      toast.success(t("integrations.calendarSynced"));
      return true;
    } catch (error) {
      console.error("Calendar sync error:", error);
      toast.error(error instanceof Error ? error.message : "Errore sincronizzazione");
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const deleteEvent = async (appointmentId: string) => {
    try {
      await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "delete-event", appointmentId },
      });
    } catch (error) {
      console.error("Calendar delete error:", error);
    }
  };

  const listCalendars = async () => {
    try {
      const res = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "list-calendars" },
      });
      if (res.error) throw new Error(res.error.message);
      return res.data;
    } catch (error) {
      console.error("List calendars error:", error);
      return null;
    }
  };

  return { syncAppointment, deleteEvent, listCalendars, syncing };
}
