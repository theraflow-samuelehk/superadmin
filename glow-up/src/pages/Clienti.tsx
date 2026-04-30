import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Phone, Mail, MoreVertical, ArchiveRestore, Edit, Archive, Camera, UserCircle, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, type Client } from "@/hooks/useClients";
import ClientFormDialog from "@/components/ClientFormDialog";
import TreatmentPhotosDialog from "@/components/TreatmentPhotosDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import ClientInviteDialog from "@/components/ClientInviteDialog";
import ClientDuplicatesTab from "@/components/ClientDuplicatesTab";

function ClientCard({ client, archived, onEdit, onArchive, onRestore, onPhotos, onDetail, onInvite }: {
  client: Client;
  archived?: boolean;
  onEdit?: (c: Client) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPhotos?: (c: Client) => void;
  onDetail?: (id: string) => void;
  onInvite?: (c: Client) => void;
}) {
  const { t } = useTranslation();
  const initials = `${client.first_name[0]}${client.last_name?.[0] ?? ""}`.toUpperCase();
  const fullName = [client.first_name, client.last_name].filter(Boolean).join(" ");

  return (
    <Card className={`shadow-card border-border/50 hover:shadow-soft transition-all duration-300 group ${archived ? "opacity-70" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{initials}</span>
            </div>
            <div>
              <p className="font-medium text-[15px] text-foreground">{fullName}</p>
              {client.source && <p className="text-xs text-muted-foreground">{client.source}</p>}
            </div>
          </div>
          {archived ? (
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => onRestore?.(client.id)}>
              <ArchiveRestore className="h-3 w-3" />{t("archive.restore")}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary border border-border/50">
                  <MoreVertical className="h-4 w-4 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(client)}>
                  <Edit className="h-3.5 w-3.5 mr-2" />{t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDetail?.(client.id)}>
                  <UserCircle className="h-3.5 w-3.5 mr-2" />{t("clients.card")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPhotos?.(client)}>
                  <Camera className="h-3.5 w-3.5 mr-2" />{t("photos.title")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onInvite?.(client)}>
                  <Send className="h-3.5 w-3.5 mr-2" />{t("portal.inviteClient")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive?.(client.id)} className="text-destructive">
                  <Archive className="h-3.5 w-3.5 mr-2" />{t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a href={`tel:${client.phone}`} className="truncate">{client.phone}</a>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <a href={`mailto:${client.email}`} className="truncate">{client.email}</a>
            </div>
          )}
        </div>
        {client.allergies && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-destructive/10 text-xs text-destructive">⚠️ {client.allergies}</div>
        )}
        {client.notes && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-secondary text-xs text-secondary-foreground">📝 {client.notes}</div>
        )}
        {archived && client.deleted_at && (
          <div className="mt-2"><Badge variant="outline" className="text-xs">{t("archive.archivedOn")} {new Date(client.deleted_at).toLocaleDateString("it-IT")}</Badge></div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Clienti() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clients, isLoading, createClient, updateClient, archiveClient, restoreClient } = useClients();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [photosClient, setPhotosClient] = useState<Client | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [inviteClient, setInviteClient] = useState<Client | null>(null);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    return name.includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const active = filtered.filter(c => !c.deleted_at);
  const archived = filtered.filter(c => c.deleted_at);

  // Duplicate detection count (on all active, not filtered)
  const duplicateCount = useMemo(() => {
    const allActive = clients.filter(c => !c.deleted_at);
    const groups = new Map<string, number>();
    for (const c of allActive) {
      const key = `${(c.first_name || "").trim().toLowerCase()}_${(c.last_name || "").trim().toLowerCase()}`;
      if (!key || key === "_") continue;
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    return Array.from(groups.values()).filter(count => count >= 2).length;
  }, [clients]);

  const handleOpenCreate = () => { setEditingClient(null); setDialogOpen(true); };
  const handleOpenEdit = (c: Client) => { setEditingClient(c); setDialogOpen(true); };

  const handleSubmit = (data: any) => {
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, ...data }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createClient.mutate(data, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-foreground">{t("clients.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("clients.registered", { count: active.length })}</p>
          </div>
          <Button variant="hero" size="lg" onClick={handleOpenCreate} data-glowup-id="clients-new-client">
            <Plus className="h-4 w-4" />
            {t("clients.newClient")}
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("clients.searchClient")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">{t("archive.active")} ({active.length})</TabsTrigger>
              {duplicateCount > 0 && (
                <TabsTrigger value="duplicates">{t("clients.duplicates")} ({duplicateCount})</TabsTrigger>
              )}
              <TabsTrigger value="archived">{t("archive.tab")} ({archived.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("clients.noClients")}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {active.map(c => <ClientCard key={c.id} client={c} onEdit={handleOpenEdit} onArchive={(id) => setArchiveTarget(id)} onPhotos={(c) => setPhotosClient(c)} onDetail={(id) => navigate(`/clienti/${id}`)} onInvite={(c) => setInviteClient(c)} />)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="duplicates">
              <ClientDuplicatesTab clients={clients} />
            </TabsContent>
            <TabsContent value="archived">
              {archived.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("archive.noArchived")}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {archived.map(c => <ClientCard key={c.id} client={c} archived onRestore={(id) => restoreClient.mutate(id)} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        onSubmit={handleSubmit}
        isPending={createClient.isPending || updateClient.isPending}
      />

      {photosClient && (
        <TreatmentPhotosDialog
          open={!!photosClient}
          onOpenChange={(open) => { if (!open) setPhotosClient(null); }}
          clientId={photosClient.id}
          clientName={`${photosClient.first_name} ${photosClient.last_name}`}
        />
      )}

      {inviteClient && (
        <ClientInviteDialog
          open={!!inviteClient}
          onOpenChange={(open) => { if (!open) setInviteClient(null); }}
          clientId={inviteClient.id}
          clientName={`${inviteClient.first_name} ${inviteClient.last_name}`}
        />
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
        title={t("clients.confirmArchive")}
        description={t("archive.archiveConfirm")}
        onConfirm={() => {
          if (archiveTarget) archiveClient.mutate(archiveTarget);
          setArchiveTarget(null);
        }}
      />
    </DashboardLayout>
  );
}
