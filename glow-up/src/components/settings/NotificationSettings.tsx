import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Megaphone, Trash2, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  body: string;
  sent_at: string | null;
  created_at: string;
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isSubscribed, isSupported, permission, loading: pushLoading, subscribe, unsubscribe } = usePushSubscription();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annSending, setAnnSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAnnouncements();
  }, [user]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setAnnouncements((data as Announcement[]) || []);
  };

  const sendAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) return;
    setAnnSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-announcement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ title: annTitle, body: annBody }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      toast.success(t("notifications.announcementSent"));
      setAnnTitle("");
      setAnnBody("");
      fetchAnnouncements();
    } catch {
      toast.error("Errore nell'invio dell'avviso");
    }
    setAnnSending(false);
  };

  const formatOffset = (minutes: number) => {
    if (minutes >= 1440) return `${minutes / 1440} ${t("notifications.days")}`;
    if (minutes >= 60) return `${minutes / 60} ${t("notifications.hours")}`;
    return `${minutes} ${t("notifications.minutes")}`;
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Push Notifications */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" /> {t("notifications.pushEnabled")}
          </CardTitle>
          <CardDescription>{t("notifications.pushEnabledDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupported ? (
            <p className="text-sm text-muted-foreground">{t("notifications.pushUnsupported")}</p>
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{t("notifications.pushEnabled")}</p>
              <Switch
                checked={isSubscribed}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    const result = await subscribe();
                    if (result === "denied") toast.error(t("notifications.pushDeniedToast", "Notifiche bloccate dal browser. Riprova dalle impostazioni del browser."), { duration: 5000 });
                    else if (result === "error") toast.error(t("notifications.pushErrorToast"));
                  } else {
                    unsubscribe();
                  }
                }}
                disabled={pushLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>


      {/* Announcements */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-primary" /> {t("notifications.announcements")}
          </CardTitle>
          <CardDescription>{t("notifications.announcementsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("notifications.announcementTitle")}</Label>
              <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("notifications.announcementBody")}</Label>
              <Textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={3} />
            </div>
            <Button variant="hero" onClick={sendAnnouncement} disabled={annSending || !annTitle.trim() || !annBody.trim()}>
              {annSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {t("notifications.sendAnnouncement")}
            </Button>
          </div>
          {announcements.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ann.body}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {t("notifications.sentAt")} {new Date(ann.created_at).toLocaleString("it-IT")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={async () => {
                        await supabase.from("announcements").delete().eq("id", ann.id);
                        toast.success(t("notifications.announcementDeleted"));
                        fetchAnnouncements();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
