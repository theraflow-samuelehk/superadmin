import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Facebook, Plus, Trash2, Loader2, ChevronDown, ExternalLink, Copy, Check, BookOpen, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FacebookPage {
  id: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
  is_active: boolean;
  created_at: string;
}

export default function FacebookLeadsSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // New page form
  const [newPageId, setNewPageId] = useState("");
  const [newPageName, setNewPageName] = useState("");
  const [newPageToken, setNewPageToken] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-lead-webhook`;
  const verifyToken = "glowup_fb_leads_verify";

  useEffect(() => {
    if (user) loadPages();
  }, [user]);

  const loadPages = async () => {
    const { data } = await supabase
      .from("facebook_pages")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setPages((data as any[]) || []);
    setLoading(false);
  };

  const handleAddPage = async () => {
    if (!newPageId.trim() || !newPageName.trim() || !newPageToken.trim()) {
      toast.error(t("facebookLeads.fillAllFields", "Compila tutti i campi"));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("facebook_pages").insert({
      user_id: user!.id,
      page_id: newPageId.trim(),
      page_name: newPageName.trim(),
      page_access_token: newPageToken.trim(),
    } as any);
    setSaving(false);
    if (error) {
      toast.error(t("facebookLeads.saveError", "Errore nel salvataggio"));
      console.error(error);
    } else {
      toast.success(t("facebookLeads.pageSaved", "Pagina Facebook salvata!"));
      setNewPageId("");
      setNewPageName("");
      setNewPageToken("");
      setShowAddForm(false);
      loadPages();
    }
  };

  const handleDeletePage = async (id: string) => {
    const { error } = await supabase.from("facebook_pages").delete().eq("id", id);
    if (error) {
      toast.error(t("facebookLeads.deleteError", "Errore nell'eliminazione"));
    } else {
      toast.success(t("facebookLeads.pageDeleted", "Pagina eliminata"));
      loadPages();
    }
  };

  const handleTogglePage = async (id: string, isActive: boolean) => {
    await supabase.from("facebook_pages").update({ is_active: !isActive } as any).eq("id", id);
    loadPages();
  };

  const copyToClipboard = (text: string, type: "url" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } else {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
    toast.success(t("common.copied", "Copiato!"));
  };

  if (loading) {
    return (
      <Card className="shadow-card border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook Configuration */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            {t("facebookLeads.title", "Facebook Lead Forms")}
          </CardTitle>
          <CardDescription>
            {t("facebookLeads.description", "Ricevi automaticamente i contatti dai moduli Facebook Lead Ads")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Webhook URL & Verify Token */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Callback URL</Label>
              <div className="flex items-center gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(webhookUrl, "url")}>
                  {urlCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verify Token</Label>
              <div className="flex items-center gap-2">
                <Input value={verifyToken} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(verifyToken, "token")}>
                  {tokenCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Setup Guide */}
          <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4" />
                  {t("facebookLeads.setupGuide", "Guida Setup: Aggiungi una Pagina Facebook")}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${guideOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              {/* Phase 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0 text-xs">1</Badge>
                  <h4 className="font-semibold text-sm">{t("facebookLeads.phase1Title", "Crea una Facebook App (se non ne hai una)")}</h4>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>{t("facebookLeads.phase1Step1", "Vai su https://developers.facebook.com/apps/")}</li>
                  <li>{t("facebookLeads.phase1Step2", "Clicca 'Create App' → Use case: 'Other' → Type: 'Business'")}</li>
                  <li>{t("facebookLeads.phase1Step3", "Assegna un nome (es. 'GlowUp Leads'), seleziona il tuo Business Manager e crea")}</li>
                </ol>
                <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline pl-8">
                  <ExternalLink className="h-3 w-3" /> Meta for Developers
                </a>
              </div>

              {/* Phase 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0 text-xs">2</Badge>
                  <h4 className="font-semibold text-sm">{t("facebookLeads.phase2Title", "Configura i Webhooks")}</h4>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>{t("facebookLeads.phase2Step1", "Nella dashboard della tua app, clicca 'Add Product' → trova 'Webhooks' → 'Set Up'")}</li>
                  <li>{t("facebookLeads.phase2Step2", "Seleziona 'Page' dal dropdown, poi 'Subscribe to this object'")}</li>
                  <li>{t("facebookLeads.phase2Step3", "Inserisci il Callback URL e il Verify Token mostrati sopra")}</li>
                  <li>{t("facebookLeads.phase2Step4", "Dopo la verifica, trova 'leadgen' nella lista dei campi e abilita il toggle ✅")}</li>
                  <li>{t("facebookLeads.phase2Step5", "Vai su App Settings → Basic, aggiungi la Privacy Policy URL, poi metti l'app in modalità Live")}</li>
                </ol>
              </div>

              {/* Phase 3 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0 text-xs">3</Badge>
                  <h4 className="font-semibold text-sm">{t("facebookLeads.phase3Title", "Genera un Token Permanente per la Pagina")}</h4>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>{t("facebookLeads.phase3Step1", "Vai su https://developers.facebook.com/tools/explorer/")}</li>
                  <li>{t("facebookLeads.phase3Step2", "Seleziona la tua app, poi seleziona 'Get User Access Token'")}</li>
                  <li>{t("facebookLeads.phase3Step3", "Abilita i permessi: pages_manage_metadata, pages_read_engagement, leads_retrieval, pages_show_list")}</li>
                  <li>{t("facebookLeads.phase3Step4", "Clicca 'Generate Access Token' e copialo")}</li>
                  <li>{t("facebookLeads.phase3Step5", "Vai su https://developers.facebook.com/tools/debug/accesstoken/ → incolla il token → clicca 'Extend Access Token' per ottenere un token di 60 giorni")}</li>
                  <li>{t("facebookLeads.phase3Step6", "Copia il token esteso, torna al Graph Explorer, incollalo nel campo Access Token")}</li>
                  <li>{t("facebookLeads.phase3Step7", "Imposta method GET, endpoint: me/accounts?fields=id,name,access_token")}</li>
                  <li>{t("facebookLeads.phase3Step8", "Clicca Submit — trova la tua pagina nei risultati. L'access_token mostrato è il tuo token PERMANENTE!")}</li>
                  <li>{t("facebookLeads.phase3Step9", "Verifica al debug tool che scadenza sia 'Expires: Never'")}</li>
                </ol>
                <div className="flex gap-3 pl-8">
                  <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Graph Explorer
                  </a>
                  <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Token Debugger
                  </a>
                </div>
              </div>

              {/* Phase 4 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0 text-xs">4</Badge>
                  <h4 className="font-semibold text-sm">{t("facebookLeads.phase4Title", "Configura in GlowUp")}</h4>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>{t("facebookLeads.phase4Step1", "Nel form qui sotto, inserisci il Facebook Page ID, il nome della pagina e il token permanente")}</li>
                  <li>{t("facebookLeads.phase4Step2", "Clicca 'Salva Pagina' — fatto! I lead da questa pagina arriveranno automaticamente")}</li>
                </ol>
              </div>

              {/* Important Notes */}
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-sm text-orange-800 dark:text-orange-200">{t("facebookLeads.importantNotes", "Note Importanti")}</span>
                </div>
                <ul className="list-disc list-inside text-xs text-orange-700 dark:text-orange-300 space-y-1">
                  <li>{t("facebookLeads.note1", "Ogni Pagina Facebook necessita del proprio token permanente")}</li>
                  <li>{t("facebookLeads.note2", "I token ottenuti da un Long-Lived User Token sono permanenti (non scadono mai)")}</li>
                  <li>{t("facebookLeads.note3", "Se una pagina viene bannata, aggiungi una nuova pagina qui — nessuna modifica al codice necessaria")}</li>
                  <li>{t("facebookLeads.note4", "L'URL del webhook e il verify token sono gli stessi per tutte le pagine")}</li>
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Connected Pages */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-base">
              {t("facebookLeads.connectedPages", "Pagine Collegate")} ({pages.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-1" />
              {t("facebookLeads.addPage", "Aggiungi Pagina")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Page Form */}
          {showAddForm && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <h4 className="font-medium text-sm">{t("facebookLeads.newPage", "Nuova Pagina Facebook")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Page ID</Label>
                  <Input
                    value={newPageId}
                    onChange={e => setNewPageId(e.target.value)}
                    placeholder="123456789012345"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("facebookLeads.pageName", "Nome Pagina")}</Label>
                  <Input
                    value={newPageName}
                    onChange={e => setNewPageName(e.target.value)}
                    placeholder="La Mia Pagina"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Page Access Token ({t("facebookLeads.permanent", "permanente")})</Label>
                <Input
                  value={newPageToken}
                  onChange={e => setNewPageToken(e.target.value)}
                  placeholder="EAAxxxxxxx..."
                  type="password"
                  className="text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="hero" size="sm" onClick={handleAddPage} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {t("facebookLeads.savePage", "Salva Pagina")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Pages List */}
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("facebookLeads.noPages", "Nessuna pagina Facebook collegata. Clicca 'Aggiungi Pagina' per iniziare.")}
            </p>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-[#1877F2] shrink-0" />
                      <span className="font-medium text-sm truncate">{page.page_name}</span>
                      <Badge variant={page.is_active ? "default" : "secondary"} className="text-xs shrink-0">
                        {page.is_active ? t("common.active") : t("facebookLeads.inactive", "Inattivo")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-6 font-mono">ID: {page.page_id}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleTogglePage(page.id, page.is_active)}
                    >
                      {page.is_active ? t("facebookLeads.disable", "Disattiva") : t("facebookLeads.enable", "Attiva")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeletePage(page.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
