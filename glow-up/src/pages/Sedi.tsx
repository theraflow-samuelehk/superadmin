import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, Edit, Archive, Star, Phone, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocations, type Location, type LocationInsert } from "@/hooks/useLocations";

export default function Sedi() {
  const { t } = useTranslation();
  const { locations, isLoading, createLocation, updateLocation, archiveLocation } = useLocations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationInsert>({ name: "", address: "", phone: "", email: "", is_primary: false });

  const handleOpen = (loc?: Location) => {
    if (loc) {
      setEditing(loc);
      setForm({ name: loc.name, address: loc.address || "", phone: loc.phone || "", email: loc.email || "", is_primary: loc.is_primary });
    } else {
      setEditing(null);
      setForm({ name: "", address: "", phone: "", email: "", is_primary: locations.length === 0 });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateLocation.mutate({ id: editing.id, ...form }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createLocation.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-foreground flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              {t("locations.title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("locations.subtitle")}</p>
          </div>
          <Button variant="hero" onClick={() => handleOpen()}>
            <Plus className="h-4 w-4 mr-1" /> {t("locations.addLocation")}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : locations.length === 0 ? (
          <Card className="shadow-card border-border/50">
            <CardContent className="py-12 text-center">
              <MapPin className="h-16 w-16 mx-auto text-primary/20 mb-4" />
              <p className="text-lg font-semibold text-foreground">{t("locations.noLocations")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("locations.addFirst")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map(loc => (
              <Card key={loc.id} className="shadow-card border-border/50 hover:shadow-soft transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-lg">{loc.name}</h3>
                      {loc.is_primary && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Star className="h-3 w-3" /> {t("locations.primary")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(loc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!loc.is_primary && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => archiveLocation.mutate(loc.id)}>
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {loc.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {loc.address}
                    </p>
                  )}
                  {loc.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {loc.phone}
                    </p>
                  )}
                  {loc.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> {loc.email}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editing ? t("locations.editLocation") : t("locations.addLocation")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("locations.name")}</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("locations.address")}</Label>
              <Input value={form.address || ""} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("locations.phone")}</Label>
                <Input value={form.phone || ""} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("locations.email")}</Label>
                <Input value={form.email || ""} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="hero" onClick={handleSubmit} disabled={!form.name || createLocation.isPending || updateLocation.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
