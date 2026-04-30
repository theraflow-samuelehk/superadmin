import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Facebook, Plus, Trash2, Loader2, ChevronDown, ExternalLink, Copy, Check, BookOpen, AlertTriangle, FlaskConical, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FacebookPage {
  id: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

export default function AdminLeadsConfigTab() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ pageId: string; success: boolean; leadId?: string; error?: string; details?: string } | null>(null);

  const [newPageId, setNewPageId] = useState("");
  const [newPageName, setNewPageName] = useState("");
  const [newPageToken, setNewPageToken] = useState("");

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-lead-webhook`;
  const verifyToken = "glowup_fb_leads_verify";

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    const { data } = await supabase
      .from("facebook_pages")
      .select("*")
      .order("created_at", { ascending: false });
    setPages((data as any[]) || []);
    setLoading(false);
  };

  const handleAddPage = async () => {
    if (!newPageId.trim() || !newPageName.trim() || !newPageToken.trim()) {
      toast.error("Compila tutti i campi");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Non autenticato"); return; }
    setSaving(true);
    const { error } = await supabase.from("facebook_pages").insert({
      user_id: user.id,
      page_id: newPageId.trim(),
      page_name: newPageName.trim(),
      page_access_token: newPageToken.trim(),
    } as any);
    setSaving(false);
    if (error) {
      toast.error("Errore nel salvataggio");
      console.error(error);
    } else {
      toast.success("Pagina Facebook salvata!");
      setNewPageId("");
      setNewPageName("");
      setNewPageToken("");
      setShowAddForm(false);
      loadPages();
    }
  };

  const handleDeletePage = async (id: string) => {
    await supabase.from("facebook_pages").delete().eq("id", id);
    toast.success("Pagina eliminata");
    loadPages();
  };

  const handleTogglePage = async (id: string, isActive: boolean) => {
    await supabase.from("facebook_pages").update({ is_active: !isActive } as any).eq("id", id);
    loadPages();
  };

  const TEST_FB_LEAD_PREFIX = "test_lead_";

  const handleTestWebhook = async (page: FacebookPage) => {
    setTesting(page.id);
    setTestResult(null);
    const testLeadId = `${TEST_FB_LEAD_PREFIX}${Date.now()}`;
    try {
      // Simulate exactly what Facebook sends to the webhook
      const fakeWebhookPayload = {
        object: "page",
        entry: [
          {
            id: page.page_id,
            time: Date.now(),
            changes: [
              {
                field: "leadgen",
                value: {
                  leadgen_id: testLeadId,
                  form_id: "test_form_001",
                  page_id: page.page_id,
                  created_time: Math.floor(Date.now() / 1000),
                },
              },
            ],
          },
        ],
      };

      // POST to the actual edge function (same URL Facebook would call)
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fakeWebhookPayload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(result)}`);

      // Verify the lead was actually saved in DB
      const { data: savedLead } = await supabase
        .from("facebook_leads")
        .select("id, full_name, email, phone, lead_data, status")
        .eq("fb_lead_id", testLeadId)
        .maybeSingle();

      if (savedLead) {
        setTestResult({ pageId: page.id, success: true, leadId: testLeadId, details: "Webhook → Edge Function → Graph API → DB ✅" });
        toast.success("✅ Test riuscito! Il flusso end-to-end funziona.");
      } else {
        setTestResult({ pageId: page.id, success: false, error: "Il webhook ha risposto OK ma il lead non è stato salvato nel DB. Controlla il page_id e il token." });
      }
    } catch (err: any) {
      console.error("[test-webhook]", err);
      setTestResult({ pageId: page.id, success: false, error: err.message });
      toast.error("Test fallito: " + err.message);
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteTestLead = async (fbLeadId: string) => {
    const { error } = await supabase
      .from("facebook_leads")
      .delete()
      .eq("fb_lead_id", fbLeadId);
    if (error) {
      toast.error("Errore eliminazione: " + error.message);
    } else {
      toast.success("Lead di test eliminato!");
      setTestResult(null);
    }
  };

  const copyToClipboard = (text: string, type: "url" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "url") { setUrlCopied(true); setTimeout(() => setUrlCopied(false), 2000); }
    else { setTokenCopied(true); setTimeout(() => setTokenCopied(false), 2000); }
    toast.success("Copiato!");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Webhook Configuration */}
      <Card className="shadow-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            Webhook Facebook
          </CardTitle>
          <CardDescription className="text-xs">
            Usa questi dati per configurare il webhook sulla Facebook App
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card className="shadow-card border-border/50">
        <CardContent className="pt-4">
          <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4" />
                  Guida Setup Completa
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${guideOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              {/* Phase 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0 text-xs">1</Badge>
                  <h4 className="font-semibold text-sm">Crea una Facebook App</h4>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>Vai su developers.facebook.com/apps/</li>
                  <li>Clicca 'Create App' → Use case: 'Other' → Type: 'Business'</li>
                  <li>Assegna un nome (es. 'GlowUp Leads'), seleziona il Business Manager e crea</li>
                </ol>
                <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline pl-8">
                  <ExternalLink className="h-3 w-3" /> Meta for Developers
                </a>
              </div>

              {/* Phase 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0 text-xs">2</Badge>
                  <h4 className="font-semibold text-sm">Configura i Webhooks</h4>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>Nella dashboard dell'app, clicca 'Add Product' → 'Webhooks' → 'Set Up'</li>
                  <li>Seleziona 'Page' dal dropdown, poi 'Subscribe to this object'</li>
                  <li>Inserisci il Callback URL e il Verify Token mostrati sopra</li>
                  <li>Trova 'leadgen' nella lista dei campi e abilita il toggle ✅</li>
                  <li>App Settings → Basic, aggiungi Privacy Policy URL (<code className="bg-muted px-1 rounded text-xs">https://salon-all-in-one.lovable.app/privacy</code>), metti l'app in Live</li>
                </ol>
              </div>

              {/* Phase 3 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0 text-xs">3</Badge>
                  <h4 className="font-semibold text-sm">Genera Token Permanente</h4>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>Vai su Graph Explorer</li>
                  <li>Seleziona la tua app → 'Get User Access Token'</li>
                  <li className="font-medium text-foreground">Abilita TUTTI questi permessi:</li>
                </ol>
                <div className="ml-8 my-2 p-3 rounded-lg bg-muted/60 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Permessi obbligatori</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {["leads_retrieval", "pages_show_list", "pages_read_engagement", "pages_manage_ads", "pages_manage_metadata", "ads_management", "ads_read", "business_management"].map(p => (
                      <Badge key={p} variant="secondary" className="font-mono text-xs">{p}</Badge>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Consigliati</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["pages_read_user_content", "pages_messaging", "email"].map(p => (
                      <Badge key={p} variant="outline" className="font-mono text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
                <ol start={4} className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>Clicca 'Generate Access Token'</li>
                  <li>Vai su Token Debugger → 'Extend Access Token' (60 giorni)</li>
                  <li>Torna al Graph Explorer, incolla il token esteso</li>
                  <li>GET: <code className="bg-muted px-1 rounded text-xs">me/accounts?fields=id,name,access_token</code></li>
                  <li>L'access_token nel risultato è il token PERMANENTE!</li>
                  <li>Verifica nel debugger che scadenza sia 'Expires: Never'</li>
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
                  <h4 className="font-semibold text-sm">Salva in GlowUp</h4>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-8">
                  <li>Clicca 'Aggiungi Pagina' qui sotto</li>
                  <li>Inserisci Page ID, nome, token permanente e user_id del centro</li>
                  <li>I lead arriveranno automaticamente + notifica push!</li>
                </ol>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-sm text-orange-800 dark:text-orange-200">Note Importanti</span>
                </div>
                <ul className="list-disc list-inside text-xs text-orange-700 dark:text-orange-300 space-y-1">
                  <li>Ogni Pagina necessita del proprio token permanente</li>
                  <li>Il webhook e il verify token sono gli stessi per tutte le pagine</li>
                  <li>Ogni lead ricevuto genera una notifica push al super admin</li>
                  <li>Per le ads dei centri, usa lo user_id del centro specifico</li>
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Connected Pages */}
      <Card className="shadow-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-base">
              Pagine Collegate ({pages.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-1" /> Aggiungi Pagina
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <h4 className="font-medium text-sm">Nuova Pagina Facebook</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Page ID</Label>
                  <Input value={newPageId} onChange={e => setNewPageId(e.target.value)} placeholder="123456789012345" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nome Pagina</Label>
                  <Input value={newPageName} onChange={e => setNewPageName(e.target.value)} placeholder="La Mia Pagina" className="text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Page Access Token (permanente)</Label>
                <Input value={newPageToken} onChange={e => setNewPageToken(e.target.value)} placeholder="EAAxxxxxxx..." type="password" className="text-sm font-mono" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddPage} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Salva Pagina
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Annulla</Button>
              </div>
            </div>
          )}

          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nessuna pagina collegata. Clicca 'Aggiungi Pagina' per iniziare.
            </p>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <div key={page.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/20">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-[#1877F2] shrink-0" />
                        <span className="font-medium text-sm truncate">{page.page_name}</span>
                        <Badge variant={page.is_active ? "default" : "secondary"} className="text-xs shrink-0">
                          {page.is_active ? "Attiva" : "Inattiva"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 pl-6 font-mono">ID: {page.page_id}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        disabled={testing === page.id}
                        onClick={() => handleTestWebhook(page)}
                      >
                        {testing === page.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3" />}
                        Test
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleTogglePage(page.id, page.is_active)}>
                        {page.is_active ? "Disattiva" : "Attiva"}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePage(page.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {testResult?.pageId === page.id && (
                    <div className={`p-3 rounded-lg border text-sm ${testResult.success ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"}`}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {testResult.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className={testResult.success ? "text-green-800 dark:text-green-200 font-medium" : "text-red-800 dark:text-red-200 font-medium"}>
                                {testResult.success ? "Flusso end-to-end OK!" : "Test fallito"}
                              </p>
                              <p className={`text-xs mt-0.5 ${testResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                                {testResult.success
                                  ? testResult.details || "Il webhook ha ricevuto il payload, interrogato la Graph API e salvato il lead nel DB."
                                  : testResult.error}
                              </p>
                            </div>
                          </div>
                          {testResult.success && testResult.leadId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                              onClick={() => handleDeleteTestLead(testResult.leadId!)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Elimina Test
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
