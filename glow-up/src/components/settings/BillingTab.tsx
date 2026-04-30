import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, MessageSquare, Phone, Receipt, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocalization } from "@/hooks/useLocalization";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UsageSummary {
  sms_count: number;
  sms_total: number;
  sms_unit_price: number;
  whatsapp_count: number;
  whatsapp_total: number;
  whatsapp_unit_price: number;
}

export default function BillingTab() {
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  const { formatCurrency, formatDate } = useLocalization();
  const { user } = useAuth();

  // Determine current billing period
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const periodStart = periodEnd
    ? new Date(new Date(periodEnd).setMonth(periodEnd.getMonth() - (subscription?.billing_period === "yearly" ? 12 : 1)))
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const { data: usage, isLoading } = useQuery<UsageSummary>({
    queryKey: ["billing-usage", user?.id, periodStart.toISOString()],
    queryFn: async () => {
      if (!user) return { sms_count: 0, sms_total: 0, sms_unit_price: 0.10, whatsapp_count: 0, whatsapp_total: 0, whatsapp_unit_price: 0.07 };

      const { data: logs } = await supabase
        .from("messaging_usage_log")
        .select("channel, unit_price")
        .eq("salon_user_id", user.id)
        .gte("created_at", periodStart.toISOString());

      const smsLogs = (logs || []).filter((l: any) => l.channel === "sms");
      const waLogs = (logs || []).filter((l: any) => l.channel === "whatsapp");

      const smsUnitPrice = smsLogs.length > 0 ? Number(smsLogs[0].unit_price) : 0.10;
      const waUnitPrice = waLogs.length > 0 ? Number(waLogs[0].unit_price) : 0.07;

      return {
        sms_count: smsLogs.length,
        sms_total: smsLogs.reduce((sum: number, l: any) => sum + Number(l.unit_price), 0),
        sms_unit_price: smsUnitPrice,
        whatsapp_count: waLogs.length,
        whatsapp_total: waLogs.reduce((sum: number, l: any) => sum + Number(l.unit_price), 0),
        whatsapp_unit_price: waUnitPrice,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const planPrice = subscription
    ? subscription.billing_period === "yearly"
      ? (subscription.plan.price_yearly ?? subscription.plan.price_monthly * 12)
      : subscription.plan.price_monthly
    : 0;

  const usageTotal = (usage?.sms_total || 0) + (usage?.whatsapp_total || 0);
  const estimatedTotal = planPrice + usageTotal;

  const billingLabel = subscription?.billing_period === "yearly" ? t("billing.yearly") : t("billing.monthly");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Card */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("billing.subscriptionTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{subscription.plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(planPrice)}/{billingLabel}
                  </p>
                </div>
                <Badge variant={subscription.cancel_at_period_end ? "destructive" : "default"}>
                  {subscription.cancel_at_period_end ? t("billing.canceling") : t("billing.active")}
                </Badge>
              </div>
              {periodEnd && (
                <p className="text-sm text-muted-foreground">
                  {t("billing.nextRenewal")}: {formatDate(periodEnd)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("billing.noSubscription")}</p>
          )}
        </CardContent>
      </Card>

      {/* Usage Card */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("billing.usageTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(periodStart)} — {periodEnd ? formatDate(periodEnd) : formatDate(new Date())}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("billing.channel")}</TableHead>
                <TableHead className="text-right">{t("billing.sent")}</TableHead>
                <TableHead className="text-right">{t("billing.unitPrice")}</TableHead>
                <TableHead className="text-right">{t("billing.subtotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> SMS
                </TableCell>
                <TableCell className="text-right">{usage?.sms_count || 0}</TableCell>
                <TableCell className="text-right">{formatCurrency(usage?.sms_unit_price || 0.10)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(usage?.sms_total || 0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" /> WhatsApp
                </TableCell>
                <TableCell className="text-right">{usage?.whatsapp_count || 0}</TableCell>
                <TableCell className="text-right">{formatCurrency(usage?.whatsapp_unit_price || 0.07)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(usage?.whatsapp_total || 0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex justify-end mt-3">
            <p className="text-sm font-medium">
              {t("billing.usageSubtotal")}: <span className="text-foreground">{formatCurrency(usageTotal)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Estimated Card */}
      <Card className="shadow-card border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {t("billing.summaryTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("billing.subscription")} {subscription?.plan.name || "—"}
            </span>
            <span className="font-medium">{formatCurrency(planPrice)}/{billingLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("billing.messagingUsage")}</span>
            <span className="font-medium">{formatCurrency(usageTotal)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>{t("billing.estimatedTotal")}</span>
            <span className="text-primary">{formatCurrency(estimatedTotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
