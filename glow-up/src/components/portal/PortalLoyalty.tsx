import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Percent, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { PortalData } from "@/hooks/useClientPortal";

interface Props {
  data: PortalData;
}

export default function PortalLoyalty({ data }: Props) {
  const { t } = useTranslation();
  const treatmentCards = data.treatment_cards || [];

  return (
    <div className="space-y-6">
      {/* Treatment cards */}
      {treatmentCards.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-serif font-bold text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />{t("loyalty.treatmentsTab")}
          </h3>
          {treatmentCards.map((card) => {
            const stamps = Array.from({ length: card.threshold }, (_, i) => i < card.stamps_count);
            const rewardLabel = card.reward_type === "discount"
              ? `${t("loyalty.rewardDiscount")} ${card.discount_pct || 10}%`
              : card.services?.name || t("loyalty.rewardFreeTreatment");

            return (
              <Card key={card.id} className="shadow-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {card.stamps_count}/{card.threshold} {t("loyalty.treatmentsDone")}
                      {card.completed_cycles > 0 && (
                        <span className="ml-1 text-primary font-medium">· {card.completed_cycles} {t("loyalty.rewardsEarned")}</span>
                      )}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {card.reward_type === "discount" ? (
                        <><Percent className="h-3 w-3 mr-1" />{rewardLabel}</>
                      ) : (
                        <><Gift className="h-3 w-3 mr-1" />{rewardLabel}</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stamps.map((filled, i) => (
                      <div
                        key={i}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                          filled
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground border border-border/50"
                        }`}
                      >
                        {filled ? <Star className="h-4 w-4" /> : i + 1}
                      </div>
                    ))}
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs bg-muted/30 text-muted-foreground border border-dashed border-border">
                      <Gift className="h-4 w-4" />
                    </div>
                  </div>
                  {card.stamps_count > 0 && card.stamps_count < card.threshold && (
                    <p className="text-xs text-muted-foreground">
                      {card.threshold - card.stamps_count} {t("loyalty.treatmentsRemaining")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">{t("loyalty.noTreatments")}</p>
      )}

      {/* Active packages */}
      {data.packages.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif font-bold text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />{t("portal.activePackages")}
          </h3>
          {data.packages.map(pkg => (
            <Card key={pkg.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pkg.used_sessions}/{pkg.total_sessions} {t("portal.sessionsUsed")}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{pkg.total_sessions - pkg.used_sessions}</span>
                  </div>
                </div>
                {pkg.expires_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("portal.expiresOn")} {format(new Date(pkg.expires_at), "d MMM yyyy", { locale: it })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
