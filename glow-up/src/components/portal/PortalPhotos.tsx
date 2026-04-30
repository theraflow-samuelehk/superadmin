import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { PortalData } from "@/hooks/useClientPortal";

interface Props {
  data: PortalData;
}

export default function PortalPhotos({ data }: Props) {
  const { t } = useTranslation();

  if (data.photos.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto" />
        <p className="text-sm text-muted-foreground">{t("portal.noPhotos")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-serif font-bold text-lg">{t("portal.treatmentPhotos")}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {data.photos.map(photo => (
          <Card key={photo.id} className="overflow-hidden shadow-card">
            <div className="aspect-square bg-secondary">
              <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-3 space-y-1">
              <Badge variant="outline" className="text-xs">
                {photo.photo_type === "before" ? t("photos.before") : t("photos.after")}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {format(new Date(photo.taken_at), "d MMM yyyy", { locale: it })}
              </p>
              {photo.notes && <p className="text-xs text-muted-foreground">{photo.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
