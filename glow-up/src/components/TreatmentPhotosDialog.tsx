import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Trash2, ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTreatmentPhotos, type TreatmentPhoto } from "@/hooks/useTreatmentPhotos";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export default function TreatmentPhotosDialog({ open, onOpenChange, clientId, clientName }: Props) {
  const { t } = useTranslation();
  const { photos, isLoading, uploadPhoto, deletePhoto, getSignedUrl } = useTreatmentPhotos(open ? clientId : null);
  const [photoType, setPhotoType] = useState("before");
  const [photoDate, setPhotoDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Load signed URLs for photos
  useEffect(() => {
    if (!photos.length) return;
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const p of photos) {
        urls[p.id] = await getSignedUrl(p.photo_url);
      }
      setSignedUrls(urls);
    };
    loadUrls();
  }, [photos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPhoto.mutateAsync({
      clientId,
      file,
      photoType,
      notes: notes || undefined,
      gdprConsent,
      takenAt: new Date(`${photoDate}T12:00:00`).toISOString(),
    });
    setNotes("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "before": return "bg-amber-100 text-amber-800";
      case "after": return "bg-green-100 text-green-800";
      case "progress": return "bg-blue-100 text-blue-800";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {t("photos.title")} — {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload section */}
          <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-4">
            <h3 className="font-semibold text-sm">{t("photos.addPhoto")}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{t("photos.type")}</Label>
                <Select value={photoType} onValueChange={setPhotoType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">{t("photos.before")}</SelectItem>
                    <SelectItem value="after">{t("photos.after")}</SelectItem>
                    <SelectItem value="progress">{t("photos.progress")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("photos.date")}</Label>
                <Input type="date" value={photoDate} onChange={(e) => setPhotoDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("photos.notes")}</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("photos.notesPlaceholder")} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="gdpr" checked={gdprConsent} onCheckedChange={(v) => setGdprConsent(!!v)} />
              <Label htmlFor="gdpr" className="text-xs">{t("photos.gdprConsent")}</Label>
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={!gdprConsent || uploadPhoto.isPending}
              />
              <Button
                variant="hero"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={!gdprConsent || uploadPhoto.isPending}
              >
                <Camera className="h-4 w-4 mr-1" />
                {uploadPhoto.isPending ? t("common.loading") : t("photos.selectFile")}
              </Button>
              {!gdprConsent && <p className="text-xs text-destructive mt-1">{t("photos.gdprRequired")}</p>}
            </div>
          </div>

          {/* Photo timeline */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("common.loading")}</p>
          ) : photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("photos.noPhotos")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {photos.map((photo) => (
                <div key={photo.id} className="flex gap-4 p-3 rounded-xl border border-border/50 bg-card">
                  {signedUrls[photo.id] ? (
                    <img
                      src={signedUrls[photo.id]}
                      alt={photo.photo_type}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted animate-pulse" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={typeColor(photo.photo_type)}>
                        {t(`photos.${photo.photo_type}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(photo.taken_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    {photo.notes && <p className="text-sm text-muted-foreground">{photo.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => deletePhoto.mutate(photo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
