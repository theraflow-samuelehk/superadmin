import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedLead {
  fb_lead_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  fb_form_id: string | null;
  created_at: string | null;
  lead_data: Record<string, string>;
  source: string;
}

interface LeadsCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

/** Parse a single CSV/TSV line respecting quoted fields */
function parseCSVLine(line: string, sep: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === sep) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSVContent(raw: string): ParsedLead[] {
  // Detect separator: tab or comma
  const firstLine = raw.split(/\r?\n/)[0] || "";
  const sep = firstLine.includes("\t") ? "\t" : ",";

  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0], sep).map((h) => h.replace(/^\ufeff/, "").toLowerCase());

  const leads: ParsedLead[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i], sep);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] || "";
    });

    // Support both Facebook ("id") and TikTok ("lead_id") column names
    const fbLeadId = row["id"] || row["lead_id"];
    if (!fbLeadId) continue;

    const fullName = row["full_name"] || row["nome_e_cognome"] || row["name"] || null;
    const email = row["email"] || row["e-mail"] || null;
    const phone = (row["phone_number"] || row["numero_di_telefono"] || row["phone number"] || "").replace(/^p:/, "").replace(/^\+/, "+") || null;
    if (!fullName && !email && !phone) continue;

    // Auto-detect source from utm_source column
    const utmSource = (row["utm_source"] || "").toLowerCase();
    const source = utmSource === "tiktok" ? "tiktok" : "facebook";

    // Build lead_data from extra fields (quiz answers etc.)
    const knownKeys = new Set([
      "id", "lead_id", "full_name", "name", "email", "e-mail",
      "phone_number", "numero_di_telefono", "phone number",
      "form_id", "form_name", "created_time",
      "ad_id", "ad_name", "adgroup_id", "adgroup_name",
      "campaign_id", "campaign_name", "utm_source", "utm_medium",
    ]);
    const leadData: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      if (!knownKeys.has(k) && v) leadData[k] = v;
    }

    leads.push({
      fb_lead_id: fbLeadId,
      full_name: fullName,
      email,
      phone,
      fb_form_id: row["form_id"] || null,
      created_at: row["created_time"] || null,
      lead_data: leadData,
      source,
    });
  }
  return leads;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    // Try UTF-16 LE first (Facebook Ads Manager export format)
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buf);
      // Check BOM: FF FE = UTF-16 LE
      if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        const decoded = new TextDecoder("utf-16le").decode(buf);
        resolve(decoded);
      } else {
        // Fallback to UTF-8
        const utf8 = new TextDecoder("utf-8").decode(buf);
        resolve(utf8);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function LeadsCsvImportDialog({ open, onOpenChange, onImported }: LeadsCsvImportDialogProps) {
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const text = await readFileAsText(file);
    const leads = parseCSVContent(text);
    setParsedLeads(leads);
    if (leads.length === 0) {
      toast.error("Nessun lead valido trovato nel file");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (parsedLeads.length === 0) return;
    setImporting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sessione scaduta");
      setImporting(false);
      return;
    }

    // Check which leads already exist
    const fbLeadIds = parsedLeads.map((l) => l.fb_lead_id);
    const { data: existing } = await supabase
      .from("facebook_leads")
      .select("fb_lead_id")
      .eq("user_id", user.id)
      .in("fb_lead_id", fbLeadIds);

    const existingIds = new Set((existing || []).map((e) => e.fb_lead_id));
    const newLeads = parsedLeads.filter((l) => !existingIds.has(l.fb_lead_id));

    if (newLeads.length === 0) {
      toast.info(`Tutti i ${parsedLeads.length} lead sono già presenti, nessuno da importare`);
      setImporting(false);
      return;
    }

    const rows = newLeads.map((l) => ({
      user_id: user.id,
      fb_lead_id: l.fb_lead_id,
      full_name: l.full_name,
      email: l.email,
      phone: l.phone,
      fb_form_id: l.fb_form_id,
      lead_data: l.lead_data,
      source: l.source,
      status: "new",
      ...(l.created_at ? { created_at: l.created_at } : {}),
    }));

    const { error, data } = await supabase
      .from("facebook_leads")
      .insert(rows as any)
      .select("id");

    setImporting(false);

    if (error) {
      toast.error("Errore durante l'importazione: " + error.message);
    } else {
      const count = data?.length || rows.length;
      const skipped = parsedLeads.length - newLeads.length;
      const msg = skipped > 0
        ? `${count} nuovi lead importati (${skipped} già presenti, saltati)`
        : `${count} lead importati con successo`;
      toast.success(msg);
      setParsedLeads([]);
      setFileName("");
      onOpenChange(false);
      onImported();
    }
  };

  const reset = () => {
    setParsedLeads([]);
    setFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importa Lead da CSV
          </DialogTitle>
        </DialogHeader>

        {parsedLeads.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Trascina il file CSV qui oppure clicca per selezionarlo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supporta il formato export di Facebook Ads Manager (UTF-16 TSV)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        ) : (
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              <span className="font-medium truncate">{fileName}</span>
              <span className="text-muted-foreground shrink-0">— {parsedLeads.length} lead</span>
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-y-auto max-h-52">
              <table className="w-full text-xs table-fixed">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left font-medium p-2 w-[25%]">Nome</th>
                    <th className="text-left font-medium p-2 w-[30%]">Email</th>
                    <th className="text-left font-medium p-2 w-[25%]">Telefono</th>
                    <th className="text-left font-medium p-2 w-[20%]">Fonte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedLeads.slice(0, 8).map((l, i) => (
                    <tr key={i}>
                      <td className="p-2 truncate">{l.full_name || "—"}</td>
                      <td className="p-2 truncate">{l.email || "—"}</td>
                      <td className="p-2 truncate">{l.phone || "—"}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          l.source === "tiktok"
                            ? "bg-accent/20 text-accent-foreground"
                            : "bg-primary/20 text-primary"
                        }`}>
                          {l.source === "tiktok" ? "🎵 TikTok" : "📘 Facebook"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedLeads.length > 8 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ...e altri {parsedLeads.length - 8} lead
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={reset} disabled={importing}>
                Cambia file
              </Button>
              <Button size="sm" onClick={handleImport} disabled={importing}>
                {importing ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importando...</>
                ) : (
                  <>Importa {parsedLeads.length} lead</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
