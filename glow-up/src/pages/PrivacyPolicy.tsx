import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-auto" style={{ height: '100dvh' }}>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Button>
        </Link>

        <h1 className="text-3xl font-serif font-bold mb-2">Informativa sulla Privacy</h1>
        <p className="text-sm text-muted-foreground mb-8">Ultimo aggiornamento: 29 marzo 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Titolare del trattamento</h2>
            <p>
              Il Titolare del trattamento dei dati personali è <strong>MERCURIUSECOM DI T. C.</strong>,
              con sede in Via Baranello 27, 00131 Roma (RM), P.IVA 17271371001, C.F. CMLTMS94C07D542S,
              REA RM-1707656.
            </p>
            <p>
              Per qualsiasi comunicazione relativa al trattamento dei dati personali, è possibile contattare
              il Titolare all'indirizzo e-mail: <a href="mailto:info@glowup.it" className="text-primary hover:underline">info@glowup.it</a> oppure
              PEC: <a href="mailto:mercuriusecom@pec.it" className="text-primary hover:underline">mercuriusecom@pec.it</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Tipologie di dati raccolti</h2>
            <p>L'applicazione GlowUp raccoglie le seguenti categorie di dati personali:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dati identificativi:</strong> nome, cognome, indirizzo e-mail, numero di telefono.</li>
              <li><strong>Dati di accesso:</strong> credenziali di autenticazione (e-mail e password cifrata).</li>
              <li><strong>Dati di utilizzo:</strong> log di accesso, interazioni con l'applicazione, preferenze.</li>
              <li><strong>Dati dei clienti del salone:</strong> anagrafica clienti, storico appuntamenti, note, allergie, foto trattamenti.</li>
              <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, sistema operativo, dati di sessione.</li>
              <li><strong>Dati di pagamento:</strong> gestiti interamente tramite Stripe; GlowUp non memorizza dati di carte di credito.</li>
              <li><strong>Notifiche push:</strong> token di sottoscrizione per l'invio di notifiche push, previo consenso esplicito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Finalità del trattamento</h2>
            <p>I dati personali sono trattati per le seguenti finalità:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Erogazione del servizio di gestione salone (agenda, clienti, servizi, operatori).</li>
              <li>Gestione dell'account utente e autenticazione.</li>
              <li>Invio di promemoria appuntamenti tramite SMS, WhatsApp e notifiche push.</li>
              <li>Comunicazioni di servizio e assistenza tecnica.</li>
              <li>Gestione della fatturazione e dei pagamenti.</li>
              <li>Miglioramento dell'esperienza utente e analisi statistiche aggregate.</li>
              <li>Adempimento di obblighi di legge e regolamentari.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Base giuridica del trattamento</h2>
            <p>Il trattamento dei dati personali si basa su:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Esecuzione del contratto:</strong> per l'erogazione dei servizi richiesti (art. 6.1.b GDPR).</li>
              <li><strong>Consenso:</strong> per l'invio di notifiche push e comunicazioni promozionali (art. 6.1.a GDPR).</li>
              <li><strong>Obbligo legale:</strong> per adempimenti fiscali e normativi (art. 6.1.c GDPR).</li>
              <li><strong>Legittimo interesse:</strong> per la sicurezza dell'applicazione e la prevenzione di frodi (art. 6.1.f GDPR).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Conservazione dei dati</h2>
            <p>
              I dati personali sono conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti,
              e comunque non oltre i termini previsti dalla normativa vigente. In particolare:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dati dell'account: per tutta la durata del rapporto contrattuale e fino a 12 mesi dalla cancellazione.</li>
              <li>Dati fiscali: conservati per 10 anni come previsto dalla normativa fiscale italiana.</li>
              <li>Log di accesso: conservati per 6 mesi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Condivisione dei dati</h2>
            <p>I dati personali possono essere condivisi con:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase Inc.</strong> — servizio di hosting e database (server UE).</li>
              <li><strong>Stripe Inc.</strong> — elaborazione pagamenti.</li>
              <li><strong>Twilio Inc.</strong> — invio SMS e messaggi WhatsApp.</li>
              <li><strong>Meta Platforms Inc.</strong> — integrazione Facebook Leads (se attivata).</li>
              <li><strong>Google LLC</strong> — sincronizzazione Google Calendar (se attivata).</li>
            </ul>
            <p>
              Tutti i fornitori terzi operano in qualità di Responsabili del trattamento ai sensi dell'art. 28 GDPR
              e garantiscono adeguate misure di sicurezza.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Diritti dell'interessato</h2>
            <p>Ai sensi degli artt. 15-22 del GDPR, l'utente ha il diritto di:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Accedere ai propri dati personali.</li>
              <li>Ottenere la rettifica o la cancellazione dei dati.</li>
              <li>Limitare od opporsi al trattamento.</li>
              <li>Richiedere la portabilità dei dati.</li>
              <li>Revocare il consenso in qualsiasi momento.</li>
              <li>Proporre reclamo all'Autorità Garante per la protezione dei dati personali.</li>
            </ul>
            <p>
              Per esercitare i propri diritti, è possibile scrivere a{" "}
              <a href="mailto:info@glowup.it" className="text-primary hover:underline">info@glowup.it</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookie e tecnologie di tracciamento</h2>
            <p>
              L'applicazione GlowUp utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio
              (autenticazione, preferenze di sessione). Non vengono utilizzati cookie di profilazione o di terze parti
              a scopo pubblicitario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Sicurezza</h2>
            <p>
              GlowUp adotta misure tecniche e organizzative adeguate per proteggere i dati personali da accessi
              non autorizzati, perdita, distruzione o alterazione, tra cui: crittografia dei dati in transito (TLS),
              Row Level Security (RLS) a livello di database, autenticazione sicura e audit log.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Modifiche alla presente informativa</h2>
            <p>
              Il Titolare si riserva il diritto di modificare la presente informativa in qualsiasi momento.
              Le modifiche saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.
              Si invita l'utente a consultare periodicamente questa pagina.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-sm text-foreground">MERCURIUSECOM DI T. C.</p>
          <p>Via Baranello 27, 00131 Roma (RM)</p>
          <p>P.IVA 17271371001 | PEC: mercuriusecom@pec.it</p>
        </div>
      </div>
    </div>
  );
}
