import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Non autenticato");

    // Validate user with anon key + user's token
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Non autenticato");

    // Service role client for privileged operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, transactionId, receiptId, vatRate = 22 } = await req.json();

    switch (action) {
      case "generate": {
        if (!transactionId) throw new Error("transactionId richiesto");

        // Get transaction
        const { data: tx, error: txError } = await supabase
          .from("transactions")
          .select("*, clients(first_name, last_name)")
          .eq("id", transactionId)
          .eq("user_id", user.id)
          .single();
        if (txError || !tx) throw new Error("Transazione non trovata");

        // Get salon info
        const { data: profile } = await supabase
          .from("profiles")
          .select("salon_name")
          .eq("user_id", user.id)
          .single();

        // Generate receipt number
        const { data: receiptNumber } = await supabase.rpc("generate_receipt_number", {
          p_user_id: user.id,
        });

        const vatAmount = Number(((tx.total * vatRate) / (100 + vatRate)).toFixed(2));
        const subtotalNet = Number((tx.total - vatAmount).toFixed(2));

        const clientName = tx.clients
          ? `${tx.clients.first_name} ${tx.clients.last_name}`
          : null;

        // Generate XML for corrispettivi (simplified structure)
        const xmlContent = generateCorrispettivoXml({
          receiptNumber: receiptNumber || "N/A",
          date: new Date().toISOString(),
          total: tx.total,
          vatRate,
          vatAmount,
          subtotal: subtotalNet,
          paymentMethod: tx.payment_method,
          items: tx.items as any[],
          salonName: profile?.salon_name || "",
        });

        const { data: receipt, error: receiptError } = await supabase
          .from("fiscal_receipts")
          .insert({
            user_id: user.id,
            transaction_id: transactionId,
            receipt_number: receiptNumber || `TEMP-${Date.now()}`,
            subtotal: subtotalNet,
            vat_rate: vatRate,
            vat_amount: vatAmount,
            total: tx.total,
            payment_method: tx.payment_method,
            status: "generated",
            salon_name: profile?.salon_name,
            client_name: clientName,
            items: tx.items,
            xml_content: xmlContent,
          })
          .select()
          .single();

        if (receiptError) throw new Error(`Errore creazione ricevuta: ${receiptError.message}`);

        return new Response(JSON.stringify({ receipt }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        const { data: receipts, error } = await supabase
          .from("fiscal_receipts")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw new Error(error.message);

        return new Response(JSON.stringify({ receipts }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "mark-sent": {
        if (!receiptId) throw new Error("receiptId richiesto");

        const { error } = await supabase
          .from("fiscal_receipts")
          .update({
            sent_to_ade: true,
            sent_at: new Date().toISOString(),
            status: "sent",
          })
          .eq("id", receiptId)
          .eq("user_id", user.id);

        if (error) throw new Error(error.message);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Azione non supportata: ${action}`);
    }
  } catch (error) {
    console.error("Fiscal receipt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateCorrispettivoXml(data: {
  receiptNumber: string;
  date: string;
  total: number;
  vatRate: number;
  vatAmount: number;
  subtotal: number;
  paymentMethod: string;
  items: any[];
  salonName: string;
}): string {
  const paymentCode = data.paymentMethod === "cash" ? "MP01" : "MP02";
  const dateStr = new Date(data.date).toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<DatiFatturaBodyDTE xmlns="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.0">
  <DatiGenerali>
    <TipoDocumento>TD01</TipoDocumento>
    <Data>${dateStr}</Data>
    <Numero>${data.receiptNumber}</Numero>
    <ImportoTotaleDocumento>${data.total.toFixed(2)}</ImportoTotaleDocumento>
  </DatiGenerali>
  <DatiBeniServizi>
    ${(data.items || []).map((item: any, i: number) => `
    <DettaglioLinee>
      <NumeroLinea>${i + 1}</NumeroLinea>
      <Descrizione>${escapeXml(item.name || "Servizio")}</Descrizione>
      <Quantita>${item.qty || 1}</Quantita>
      <PrezzoUnitario>${(item.price || 0).toFixed(2)}</PrezzoUnitario>
      <PrezzoTotale>${((item.price || 0) * (item.qty || 1)).toFixed(2)}</PrezzoTotale>
      <AliquotaIVA>${data.vatRate.toFixed(2)}</AliquotaIVA>
    </DettaglioLinee>`).join("")}
    <DatiRiepilogo>
      <AliquotaIVA>${data.vatRate.toFixed(2)}</AliquotaIVA>
      <ImponibileImporto>${data.subtotal.toFixed(2)}</ImponibileImporto>
      <Imposta>${data.vatAmount.toFixed(2)}</Imposta>
    </DatiRiepilogo>
  </DatiBeniServizi>
  <DatiPagamento>
    <CondizioniPagamento>TP02</CondizioniPagamento>
    <DettaglioPagamento>
      <ModalitaPagamento>${paymentCode}</ModalitaPagamento>
      <ImportoPagamento>${data.total.toFixed(2)}</ImportoPagamento>
    </DettaglioPagamento>
  </DatiPagamento>
</DatiFatturaBodyDTE>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
