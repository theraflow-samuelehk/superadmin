import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientPortal } from "@/hooks/useClientPortal";
import PortalLayout from "@/components/portal/PortalLayout";
import PortalBooking, { type RescheduleInfo } from "@/components/portal/PortalBooking";
import PortalAppointments from "@/components/portal/PortalAppointments";
import PortalLoyalty from "@/components/portal/PortalLoyalty";
import PortalPhotos from "@/components/portal/PortalPhotos";
import PortalChat from "@/components/portal/PortalChat";
import PortalTutorials from "@/components/portal/PortalTutorials";
import ShopPublic from "@/pages/ShopPublic";
import { PushToggleCard } from "@/components/portal/PushToggleCard";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, MapPin, Phone, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocalization } from "@/hooks/useLocalization";
import { useSearchParams } from "react-router-dom";

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

export default function Portal() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { data, isLoading, error, refetch, fetchSlots, bookAppointment, cancelAppointment, confirmAppointment } = useClientPortal();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("push_action") ? "appointments" : (searchParams.get("tab") || "book");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [rescheduleInfo, setRescheduleInfo] = useState<RescheduleInfo | null>(null);

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PortalLayout>
    );
  }

  if (error || !data) {
    return (
      <PortalLayout>
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">{t("portal.errorLoading")}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t("portal.retry")}
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const clientName = [data.client.first_name, data.client.last_name].filter(Boolean).join(" ");

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/portal/login";
  };

  const handleReschedule = (apt: { id: string; service_id: string; operator_id: string; package_id?: string | null }) => {
    setRescheduleInfo({
      appointmentId: apt.id,
      serviceId: apt.service_id,
      operatorId: apt.operator_id,
      packageId: apt.package_id ?? null,
    });
    setActiveTab("book");
  };

  return (
    <PortalLayout
      salonName={data.salon.name}
      clientName={clientName}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== "book") setRescheduleInfo(null);
      }}
      loyaltyEnabled={data.salon.loyalty_enabled}
      shopSlug={data.salon.shop_slug}
      tutorialsEnabled={false}
    >
      <div className={`animate-fade-in flex flex-col flex-1 min-h-0 ${activeTab === 'shop' ? '' : 'max-w-3xl mx-auto'}`}>
        {activeTab === "book" && (
          <PortalBooking
            data={data}
            fetchSlots={fetchSlots}
            bookAppointment={bookAppointment}
            cancelAppointment={cancelAppointment}
            onBooked={refetch}
            rescheduleInfo={rescheduleInfo}
            onRescheduleDone={() => {
              setRescheduleInfo(null);
              setActiveTab("appointments");
            }}
          />
        )}

        {activeTab === "appointments" && (
          <PortalAppointments
            data={data}
            onCancel={cancelAppointment}
            onReschedule={handleReschedule}
          />
        )}

        {activeTab === "loyalty" && data.salon.loyalty_enabled && (
          <PortalLoyalty data={data} />
        )}

        {activeTab === "photos" && (
          <PortalPhotos data={data} />
        )}

        {activeTab === "chat" && (
          <PortalChat salonUserId={data.salon.user_id} clientId={data.client.id} />
        )}

        {activeTab === "tutorials" && (
          <PortalTutorials />
        )}

        {activeTab === "myCenter" && (
          <MyCenterSection salon={data.salon} />
        )}

        {activeTab === "shop" && data.salon.shop_slug && (
          <div className="flex-1 overflow-auto">
            <ShopPublic embeddedSlug={data.salon.shop_slug} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{t("portal.settingsTitle")}</h2>

            <PushToggleCard />

            <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              {t("common.logout")}
            </Button>
          </div>
        )}
      </div>
      
    </PortalLayout>
  );
}

function MyCenterSection({ salon }: { salon: { name: string; opening_hours: any; phone: string | null; address: string | null } }) {
  const { t } = useTranslation();
  const hours = salon.opening_hours || {};
  const dayLabels = t("settings.days", { returnObjects: true }) as string[];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">{t("portal.myCenter")}</h2>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            {salon.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {salon.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {salon.address}
            </p>
          )}
          {salon.phone && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" /> {salon.phone}
            </p>
          )}
          <div>
            <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t("portal.openingHours")}
            </p>
            <div className="space-y-1">
              {DAY_INDICES.map((dayIdx, idx) => {
                const dayData = hours[dayIdx] || hours[String(dayIdx)];
                const isClosed = !dayData || !dayData.enabled;
                return (
                  <div key={dayIdx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{dayLabels[idx]}</span>
                    <span className={isClosed ? "text-muted-foreground" : "text-foreground font-medium"}>
                      {isClosed ? t("settings.closed") : `${dayData.open} – ${dayData.close}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
