import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Sparkles, XCircle, RotateCcw, AlertTriangle, Headset, Wrench, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Pricing() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { plans, subscription, loading } = useSubscription();
  const { checkout, loading: checkoutLoading, cancelSubscription, reactivateSubscription, portalLoading } = useStripeCheckout();
  const [searchParams] = useSearchParams();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  // Trial mode can be activated via URL param (e.g. from trial expired dialog)
  const isTrialMode = searchParams.get("trial") === "true";

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success(t("pricing.checkoutSuccess"));
    } else if (searchParams.get("canceled") === "true") {
      toast.info(t("pricing.checkoutCanceled"));
    }
  }, [searchParams, t]);

  const handleCancel = async () => {
    const ok = await cancelSubscription();
    if (ok) {
      toast.success(t("pricing.cancelSuccess", { date: subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("it-IT") : "" }));
      setShowCancelConfirm(false);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleReactivate = async () => {
    const ok = await reactivateSubscription();
    if (ok) {
      toast.success(t("pricing.reactivateSuccess"));
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-96" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isCanceling = subscription?.billing_period && (subscription as any).cancel_at_period_end;

  const benefits = [
    { icon: CheckCircle2, label: t("pricing.fullAccess") },
    { icon: Headset, label: t("pricing.lifetimeSupport") },
    { icon: Wrench, label: t("pricing.freeCustomizations") },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">{t("pricing.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("pricing.subtitle")}</p>
        </div>

        {/* Active subscription card */}
        {subscription && (
          <Card className={`shadow-card border-border/50 ${isCanceling ? "bg-gradient-to-r from-destructive/5 to-destructive/10 border-destructive/20" : "bg-gradient-to-r from-primary/5 to-accent/5"}`}>
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {t("pricing.activePlan")}: {subscription.plan.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(subscription.plan.price_monthly)}/{t("pricing.month")}
                  {subscription.current_period_end && (
                    <> · {isCanceling
                      ? t("pricing.expiresOn", { date: new Date(subscription.current_period_end).toLocaleDateString("it-IT") })
                      : t("pricing.renewsOn", { date: new Date(subscription.current_period_end).toLocaleDateString("it-IT") })
                    }</>
                  )}
                </p>
                {isCanceling && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {t("pricing.cancelPending", { date: subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("it-IT") : "" })}
                  </p>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {isCanceling ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleReactivate}
                    disabled={portalLoading}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {portalLoading ? t("common.loading") : t("pricing.reactivate")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={portalLoading}
                    className="gap-2 w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4" />
                    {t("pricing.cancelSubscription")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discount code */}
        <div className="flex items-center gap-3 max-w-md">
          <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder={t("pricing.discountCode")}
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            className="flex-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan?.id === plan.id;
            const isPopular = plan.slug === "growth";
            const maxAppointments = (plan as any).max_appointments;

            return (
              <Card
                key={plan.id}
                className={`shadow-card border-border/50 relative transition-all duration-300 hover:shadow-soft ${isPopular ? "ring-2 ring-primary" : ""} ${isCurrentPlan ? "bg-primary/5" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Sparkles className="h-3 w-3" /> {t("pricing.mostPopular")}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-serif">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-semibold text-foreground">{formatCurrency(plan.price_monthly)}</span>
                    <span className="text-muted-foreground">/{t("pricing.month")}</span>
                  </div>
                  {isTrialMode && (
                    <p className="text-sm text-primary font-medium mt-1">{t("pricing.trialLabel")}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {maxAppointments
                        ? t("pricing.maxAppointments", { count: maxAppointments })
                        : t("pricing.unlimitedAppointments")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {plan.max_operators >= 999
                        ? t("pricing.unlimitedOperators")
                        : t("pricing.maxOperators", { count: plan.max_operators })}
                    </p>
                  </div>
                  
                  <div className="border-t border-border/50 pt-3 space-y-2">
                    {benefits.map((b) => (
                      <div key={b.label} className="flex items-center gap-2 text-sm text-foreground">
                        <b.icon className="h-4 w-4 text-primary shrink-0" />
                        <span>{b.label}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={isCurrentPlan ? "outline" : isPopular ? "hero" : "default"}
                    className="w-full"
                    disabled={isCurrentPlan || checkoutLoading}
                    onClick={() => !isCurrentPlan && checkout(plan.id, "monthly", discountCode || undefined, isTrialMode)}
                  >
                    {checkoutLoading
                      ? t("common.loading")
                      : isCurrentPlan
                        ? t("pricing.currentPlan")
                        : isTrialMode
                          ? t("pricing.startTrial")
                          : t("pricing.upgrade")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {isTrialMode && (
          <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mt-4">
            {t("pricing.trialFooterNote")}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title={t("pricing.cancelConfirmTitle")}
        description={t("pricing.cancelConfirmDesc", { date: subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("it-IT") : "" })}
        onConfirm={handleCancel}
        variant="destructive"
      />
    </DashboardLayout>
  );
}
