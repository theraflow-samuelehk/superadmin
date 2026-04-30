import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Edit2, ArchiveRestore, Archive, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useServices, useServiceCategories } from "@/hooks/useServices";
import { useOperators } from "@/hooks/useOperators";
import ServiceFormDialog, { type ServiceSubmitData } from "@/components/ServiceFormDialog";
import { useState } from "react";

export default function Servizi() {
  const { t } = useTranslation();
  const { services, isLoading, createService, updateService, archiveService, restoreService } = useServices();
  const { categories } = useServiceCategories();
  const { operators, updateOperator } = useOperators();
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const active = services.filter(s => !s.deleted_at);
  const archived = services.filter(s => s.deleted_at);

  // Group active by category
  const activeCategories = categories.filter(c => !c.deleted_at);
  const activeCategoryIds = new Set(activeCategories.map(c => c.id));
  const grouped = activeCategories.map(cat => ({
    ...cat,
    services: active.filter(s => s.category_id === cat.id),
  }));
  const uncategorized = active.filter(s => !s.category_id || !activeCategoryIds.has(s.category_id));

  const handleOpenCreate = () => { setEditingService(null); setServiceDialogOpen(true); };
  const handleOpenEdit = (s: any) => { setEditingService(s); setServiceDialogOpen(true); };

  const syncOperatorServiceIds = (serviceId: string, selectedOperatorIds: string[]) => {
    const activeOps = operators.filter(op => !op.deleted_at);
    for (const op of activeOps) {
      const currentIds = op.service_ids ?? [];
      const isSelected = selectedOperatorIds.includes(op.id);
      const hasService = currentIds.includes(serviceId);

      if (isSelected && !hasService) {
        updateOperator.mutate({ id: op.id, service_ids: [...currentIds, serviceId] });
      } else if (!isSelected && hasService) {
        updateOperator.mutate({ id: op.id, service_ids: currentIds.filter(id => id !== serviceId) });
      }
    }
  };

  const handleSubmit = (data: ServiceSubmitData) => {
    const { operatorIds, ...serviceData } = data;
    if (editingService) {
      updateService.mutate({ id: editingService.id, ...serviceData }, {
        onSuccess: () => {
          if (operatorIds) syncOperatorServiceIds(editingService.id, operatorIds);
          setServiceDialogOpen(false);
        }
      });
    } else {
      createService.mutate(serviceData, {
        onSuccess: (newService: any) => {
          if (operatorIds && newService?.id) syncOperatorServiceIds(newService.id, operatorIds);
          setServiceDialogOpen(false);
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">{t("services.title")}</h1>
          <Button variant="hero" size="sm" className="gap-1.5" onClick={handleOpenCreate} data-glowup-id="services-new-btn">
            <Plus className="h-4 w-4" />
            {t("services.createService")}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">{t("archive.active")} ({active.length})</TabsTrigger>
              <TabsTrigger value="archived">{t("archive.tab")} ({archived.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("services.noServices")}</p>
              ) : (
                <div className="space-y-6">
                  {grouped.filter(g => g.services.length > 0).map(cat => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{cat.emoji}</span>
                        <h2 className="text-sm font-medium text-foreground uppercase tracking-wide">{cat.name}</h2>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{cat.services.length}</Badge>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
                        {cat.services.map(svc => (
                          <ServiceRow key={svc.id} service={svc} onEdit={handleOpenEdit} onArchive={(id) => archiveService.mutate(id)} t={t} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {uncategorized.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-sm font-medium text-foreground uppercase tracking-wide">{t("services.uncategorized")}</h2>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{uncategorized.length}</Badge>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
                        {uncategorized.map(svc => (
                          <ServiceRow key={svc.id} service={svc} onEdit={handleOpenEdit} onArchive={(id) => archiveService.mutate(id)} t={t} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="archived">
              {archived.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("archive.noArchived")}</p>
              ) : (
                <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50 overflow-hidden opacity-70">
                  {archived.map(svc => (
                    <div key={svc.id} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{svc.name}</p>
                        {svc.deleted_at && <p className="text-[11px] text-muted-foreground">{t("archive.archivedOn")} {new Date(svc.deleted_at).toLocaleDateString("it-IT")}</p>}
                      </div>
                      <Button variant="outline" size="sm" className="text-xs gap-1 shrink-0" onClick={() => restoreService.mutate(svc.id)}>
                        <ArchiveRestore className="h-3 w-3" />{t("archive.restore")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ServiceFormDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={editingService}
        categories={categories}
        operators={operators}
        onSubmit={handleSubmit}
        isPending={createService.isPending || updateService.isPending}
      />
    </DashboardLayout>
  );
}

function ServiceRow({ service, onEdit, onArchive, t }: { service: any; onEdit: (s: any) => void; onArchive: (id: string) => void; t: any }) {
  return (
    <div className="flex items-center px-3 sm:px-4 py-2 gap-2.5 hover:bg-secondary/30 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-normal text-[13px] text-foreground truncate">{service.name}</p>
          {service.is_package && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0 gap-0.5">
              📦 {service.package_sessions} {t("packages.sessions", "sedute")}
            </Badge>
          )}
        </div>
        {service.description && <p className="text-[10px] text-muted-foreground/70 truncate">{service.description}</p>}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
        <Clock className="h-3 w-3" />
        <span>{service.duration_minutes}'</span>
      </div>
      <span className="text-[13px] font-semibold text-primary shrink-0 w-16 text-right">
        € {service.is_package && service.package_price != null ? Number(service.package_price).toFixed(2) : Number(service.price).toFixed(2)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded-lg hover:bg-secondary shrink-0">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(service)}><Edit2 className="h-3.5 w-3.5 mr-2" />{t("common.edit")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onArchive(service.id)} className="text-destructive"><Archive className="h-3.5 w-3.5 mr-2" />{t("common.delete")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
