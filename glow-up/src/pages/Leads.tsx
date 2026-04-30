import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2, Phone, Mail, User, FileText, Calendar, Filter, RefreshCw } from "lucide-react";
import fbLogo from "@/assets/facebook-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocalization } from "@/hooks/useLocalization";
import { toast } from "sonner";

interface Lead {
  id: string;
  fb_lead_id: string;
  fb_form_id: string | null;
  fb_page_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  lead_data: any;
  created_at: string;
  facebook_page_id: string | null;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Nuovo", color: "bg-blue-500" },
  { value: "contacted", label: "Contattato", color: "bg-yellow-500" },
  { value: "qualified", label: "Qualificato", color: "bg-green-500" },
  { value: "converted", label: "Convertito", color: "bg-primary" },
  { value: "lost", label: "Perso", color: "bg-destructive" },
];

export default function Leads() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatDate, formatTime } = useLocalization();
  const formatDateTime = (d: Date) => `${formatDate(d)} ${formatTime(d)}`;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const loadLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("facebook_leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setLeads((data as any[]) || []);
    setLoading(false);
  }, [user, statusFilter]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (lead.full_name || "").toLowerCase().includes(s) ||
      (lead.email || "").toLowerCase().includes(s) ||
      (lead.phone || "").toLowerCase().includes(s)
    );
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    await supabase.from("facebook_leads").update({ status: newStatus } as any).eq("id", leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null);
    }
    toast.success(t("facebookLeads.statusUpdated", "Stato aggiornato"));
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    await supabase.from("facebook_leads").update({ notes: editNotes } as any).eq("id", selectedLead.id);
    setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: editNotes } : l)));
    setSelectedLead((prev) => prev ? { ...prev, notes: editNotes } : null);
    toast.success(t("facebookLeads.notesSaved", "Note salvate"));
  };

  const statusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <span className={`h-2 w-2 rounded-full ${opt?.color || "bg-muted"}`} />
        {opt?.label || status}
      </Badge>
    );
  };

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <img src={fbLogo} alt="Facebook" className="h-5 w-5 object-contain" />
              {t("facebookLeads.leadsTitle", "Facebook Leads")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("facebookLeads.leadsSubtitle", "Gestisci i contatti ricevuti dai moduli Facebook")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadLeads}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("facebookLeads.refresh", "Aggiorna")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("facebookLeads.totalLeads", "Totale"), value: stats.total, icon: User },
            { label: t("facebookLeads.newLeads", "Nuovi"), value: stats.new, icon: () => <img src={fbLogo} alt="FB" className="h-4 w-4 object-contain" /> },
            { label: t("facebookLeads.contactedLeads", "Contattati"), value: stats.contacted, icon: Phone },
            { label: t("facebookLeads.convertedLeads", "Convertiti"), value: stats.converted, icon: Calendar },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card border-border/50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("facebookLeads.searchPlaceholder", "Cerca per nome, email o telefono...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("facebookLeads.allStatuses", "Tutti gli stati")}</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads List */}
        <Card className="shadow-card border-border/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <img src={fbLogo} alt="Facebook" className="h-10 w-10 object-contain opacity-30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? t("facebookLeads.noResults", "Nessun lead trovato con questi filtri")
                    : t("facebookLeads.noLeads", "Nessun lead ricevuto. Configura una pagina Facebook nelle Impostazioni → Integrazioni.")}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile: Cards */}
                <div className="sm:hidden divide-y divide-border">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 space-y-2 cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() => { setSelectedLead(lead); setEditNotes(lead.notes || ""); }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{lead.full_name || t("facebookLeads.noName", "Senza nome")}</span>
                        {statusBadge(lead.status)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(new Date(lead.created_at))}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop: Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("facebookLeads.name", "Nome")}</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>{t("facebookLeads.phone", "Telefono")}</TableHead>
                        <TableHead>{t("facebookLeads.status", "Stato")}</TableHead>
                        <TableHead>{t("facebookLeads.date", "Data")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer"
                          onClick={() => { setSelectedLead(lead); setEditNotes(lead.notes || ""); }}
                        >
                          <TableCell className="font-medium">{lead.full_name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.email || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.phone || "—"}</TableCell>
                          <TableCell>{statusBadge(lead.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDateTime(new Date(lead.created_at))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Lead Detail Dialog */}
        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedLead?.full_name || t("facebookLeads.leadDetail", "Dettaglio Lead")}
              </DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">{selectedLead.email}</a>
                    </div>
                  )}
                  {selectedLead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedLead.phone}`} className="text-primary hover:underline">{selectedLead.phone}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(new Date(selectedLead.created_at))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("facebookLeads.status", "Stato")}</label>
                  <Select value={selectedLead.status} onValueChange={(val) => handleStatusChange(selectedLead.id, val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("facebookLeads.notes", "Note")}</label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder={t("facebookLeads.notesPlaceholder", "Aggiungi note su questo lead...")}
                    rows={3}
                  />
                  <Button variant="outline" size="sm" onClick={handleSaveNotes} className="mt-1">
                    {t("common.saveShort")}
                  </Button>
                </div>

                {/* Raw Data */}
                {selectedLead.lead_data && Object.keys(selectedLead.lead_data).length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {t("facebookLeads.rawData", "Dati Grezzi")}
                    </label>
                    <pre className="text-xs bg-secondary/50 p-3 rounded-lg overflow-auto max-h-40 font-mono">
                      {JSON.stringify(selectedLead.lead_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
