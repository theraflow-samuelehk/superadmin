import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, TrendingDown, Users, CalendarX, Sparkles, RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AISuggestion {
  type: string;
  title: string;
  description: string;
  priority: string;
}

interface Metrics {
  totalClients: number;
  recentAppointments: number;
  recentRevenue: number;
  revenueTrend: string | null;
  noShowRate: string;
  inactiveClients: number;
}

export default function AIAssistant() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<number[]>([]);

  const fetchSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    setDismissed([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {});
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setSuggestions(data.suggestions || []);
      setMetrics(data.metrics || null);
    } catch (e: any) {
      toast.error(e.message || "Errore AI");
    } finally {
      setLoading(false);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "inactive_clients": return <Users className="h-5 w-5" />;
      case "no_show_risk": return <CalendarX className="h-5 w-5" />;
      case "agenda_optimization": return <Sparkles className="h-5 w-5" />;
      case "trend_analysis": return <TrendingUp className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "";
    }
  };

  const revenueTrendNum = metrics?.revenueTrend ? parseFloat(metrics.revenueTrend) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              {t("ai.title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("ai.subtitle")}</p>
          </div>
          <Button variant="hero" onClick={fetchSuggestions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            {loading ? t("common.loading") : t("ai.analyze")}
          </Button>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{metrics.totalClients}</p>
                <p className="text-xs text-muted-foreground">{t("ai.totalClients")}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{metrics.recentAppointments}</p>
                <p className="text-xs text-muted-foreground">{t("ai.recentAppointments")}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border/50">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold text-foreground">€{metrics.recentRevenue.toFixed(0)}</p>
                  {revenueTrendNum !== null && (
                    <span className={`text-xs flex items-center ${revenueTrendNum >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {revenueTrendNum >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {revenueTrendNum >= 0 ? "+" : ""}{metrics.revenueTrend}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t("ai.monthlyRevenue")}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{metrics.inactiveClients}</p>
                <p className="text-xs text-muted-foreground">{t("ai.inactiveClients")}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Suggestions */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : suggestions.length === 0 ? (
          <Card className="shadow-card border-border/50">
            <CardContent className="py-12 text-center">
              <Brain className="h-16 w-16 mx-auto text-primary/20 mb-4" />
              <p className="text-lg font-semibold text-foreground">{t("ai.noSuggestions")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("ai.clickAnalyze")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {suggestions.map((s, i) => dismissed.includes(i) ? null : (
              <Card key={i} className={`shadow-card border ${priorityColor(s.priority)} transition-all hover:shadow-soft`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                      {typeIcon(s.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{s.title}</h3>
                        <Badge variant="outline" className="text-xs capitalize">{s.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setDismissed(prev => [...prev, i])}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
