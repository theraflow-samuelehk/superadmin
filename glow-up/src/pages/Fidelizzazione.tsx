import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Star, CalendarCheck, Gift, Percent, Stamp, Trash2, Pencil, Info } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useTreatmentCards, type TreatmentCard } from "@/hooks/useTreatmentCards";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Fidelizzazione() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { clients } = useClients();
  const { services } = useServices();
  const { cards, createCard, updateCard, deleteCard, addStamp } = useTreatmentCards();

  const activeClients = clients.filter((c) => !c.deleted_at);
  const activeServices = services.filter((s) => !s.deleted_at);

  // Card dialog (create/edit)
  const [cardDialog, setCardDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<TreatmentCard | null>(null);
  const [cClientId, setCClientId] = useState("");
  const [cThreshold, setCThreshold] = useState(10);
  const [cRewardType, setCRewardType] = useState("discount");
  const [cServiceId, setCServiceId] = useState("");
  const [cDiscountPct, setCDiscountPct] = useState(10);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreateCard = () => {
    setEditingCard(null);
    setCClientId("");
    setCThreshold(10);
    setCRewardType("discount");
    setCServiceId("");
    setCDiscountPct(10);
    setCardDialog(true);
  };

  const openEditCard = (card: TreatmentCard) => {
    setEditingCard(card);
    setCClientId(card.client_id);
    setCThreshold(card.threshold);
    setCRewardType(card.reward_type);
    setCServiceId(card.reward_service_id || "");
    setCDiscountPct(card.discount_pct || 10);
    setCardDialog(true);
  };

  const handleSaveCard = () => {
    const rewardServiceId = cRewardType === "free_specific" ? cServiceId || undefined : undefined;
    const rewardType = cRewardType === "free_specific" ? "free_treatment" : cRewardType;
    const discountPct = cRewardType === "discount" ? cDiscountPct : 10;

    if (editingCard) {
      updateCard.mutate({
        id: editingCard.id,
        threshold: cThreshold,
        reward_type: rewardType,
        reward_service_id: rewardServiceId || null,
        discount_pct: discountPct,
      }, {
        onSuccess: () => { setCardDialog(false); setEditingCard(null); },
      });
    } else {
      if (!cClientId) return;
      createCard.mutate({
        client_id: cClientId,
        threshold: cThreshold,
        reward_type: rewardType,
        reward_service_id: rewardServiceId,
        discount_pct: discountPct,
      }, {
        onSuccess: () => { setCardDialog(false); setCClientId(""); setCThreshold(10); setCRewardType("discount"); setCServiceId(""); },
      });
    }
  };

  // Treatment cards KPIs
  const totalActiveCards = cards.length;
  const totalStamps = cards.reduce((s, c) => s + c.stamps_count, 0);
  const totalRewards = cards.reduce((s, c) => s + c.completed_cycles, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">{t("loyalty.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("loyalty.subtitle")}</p>
          </div>
          <Button variant="hero" onClick={openCreateCard}>
            <Plus className="h-4 w-4" />{t("loyalty.createCard")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />{t("loyalty.autoStampInfo")}
        </p>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="shadow-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{t("loyalty.activeCards")}</p>
              <p className="text-2xl font-bold text-primary">{totalActiveCards}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Stamp className="h-3 w-3" />{t("loyalty.totalStamps")}</p>
              <p className="text-2xl font-bold">{totalStamps}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Gift className="h-3 w-3" />{t("loyalty.clientsWithReward")}</p>
              <p className="text-2xl font-bold text-accent-foreground">{totalRewards}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards grid */}
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("loyalty.noTreatments")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => {
              const stamps = Array.from({ length: card.threshold }, (_, i) => i < card.stamps_count);
              const clientName = card.clients
                ? `${card.clients.first_name} ${card.clients.last_name}`
                : "—";
              const rewardLabel = card.reward_type === "discount"
                ? `${t("loyalty.rewardDiscount")} ${card.discount_pct}%`
                : card.services?.name
                  ? card.services.name
                  : t("loyalty.rewardFreeTreatment");

              return (
                <Card key={card.id} className="shadow-card border-border/50 overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {card.clients ? `${card.clients.first_name[0]}${card.clients.last_name[0]}` : "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {card.stamps_count}/{card.threshold} {t("loyalty.treatmentsDone")}
                            {card.completed_cycles > 0 && (
                              <span className="ml-1 text-primary font-medium">· {card.completed_cycles} {t("loyalty.rewardsEarned")}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditCard(card)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(card.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

                    <Badge variant="outline" className="text-xs">
                      {card.reward_type === "discount" ? (
                        <><Percent className="h-3 w-3 mr-1" />{rewardLabel}</>
                      ) : (
                        <><Gift className="h-3 w-3 mr-1" />{rewardLabel}</>
                      )}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Card Dialog */}
      <Dialog open={cardDialog} onOpenChange={setCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? t("loyalty.editCard") : t("loyalty.createCard")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingCard && (
              <div><Label>{t("agenda.client")}</Label>
                <Select value={cClientId} onValueChange={setCClientId}>
                  <SelectTrigger><SelectValue placeholder={t("loyalty.selectClient")} /></SelectTrigger>
                  <SelectContent>
                    {activeClients.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label>{t("loyalty.stampsThreshold")}</Label>
              <Input type="number" min={2} max={100} value={cThreshold} onChange={(e) => setCThreshold(Number(e.target.value))} />
            </div>
            <div><Label>{t("loyalty.rewardType")}</Label>
              <Select value={cRewardType} onValueChange={(v) => { setCRewardType(v); if (v !== "free_specific") setCServiceId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">
                    <span className="flex items-center gap-1"><Percent className="h-3 w-3" />{t("loyalty.rewardDiscount")}</span>
                  </SelectItem>
                  <SelectItem value="free_treatment">
                    <span className="flex items-center gap-1"><Gift className="h-3 w-3" />{t("loyalty.rewardGenericFree")}</span>
                  </SelectItem>
                  <SelectItem value="free_specific">
                    <span className="flex items-center gap-1"><Gift className="h-3 w-3" />{t("loyalty.rewardSpecificService")}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cRewardType === "discount" && (
              <div><Label>{t("loyalty.discountPercent")}</Label>
                <Input type="number" min={1} max={100} value={cDiscountPct} onChange={(e) => setCDiscountPct(Number(e.target.value))} />
              </div>
            )}
            {cRewardType === "free_specific" && (
              <div><Label>{t("agenda.service")}</Label>
                <Select value={cServiceId} onValueChange={setCServiceId}>
                  <SelectTrigger><SelectValue placeholder={t("agenda.selectService")} /></SelectTrigger>
                  <SelectContent>
                    {activeServices.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCardDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSaveCard} disabled={createCard.isPending || updateCard.isPending}>{t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
        title={t("loyalty.deleteCard")}
        description={t("loyalty.deleteCardConfirm")}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteCard.mutate(deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
      />
    </DashboardLayout>
  );
}
