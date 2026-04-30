# Checklist Completa Test — Flusso "Solo Conferma"

> Documento di riferimento per il testing manuale del flusso di notifica "Solo Conferma".
> Ogni sezione B-H va verificata per **ciascun metodo di creazione** (sezione A).

---

## A. CREAZIONE APPUNTAMENTO

| ID | Metodo | Descrizione |
|----|--------|-------------|
| A1 | Admin → Agenda veloce | Click diretto su slot nel calendario |
| A2 | Admin → Bottone fucsia | Form completo di creazione appuntamento |
| A3 | Cliente → Portale cliente | Prenotazione da app/link invito (utente autenticato) |
| A4 | Visitor → Prenotazione pubblica | Prenotazione da `/prenota-online/slug` (utente anonimo) |

---

## B. INVIO NOTIFICA CONFERMA

| ID | Scenario | Risultato atteso |
|----|----------|-----------------|
| B1 | Cliente con PWA + push attivo | Riceve **solo push** (no WhatsApp/SMS) |
| B2 | Cliente con PWA, push disattivato | Fallback: WhatsApp (+10min) → SMS (+20min) |
| B3 | Cliente senza `auth_user_id` (walk-in con telefono) | Salta push → WhatsApp → SMS |
| B4 | Cliente senza telefono, con PWA | Solo push |
| B5 | Cliente senza telefono, senza PWA | Nessuna notifica inviata |
| B6 | Walk-in anonimo (`client_id = null`) | Nessun flusso creato (o flusso vuoto) |

---

## C. TIMING (Casi A-E)

| ID | Preavviso | Comportamento atteso |
|----|-----------|---------------------|
| C1 | > 24h (Caso A) | Conferma immediata, escalation con delay standard (Push → WA +10m → SMS +20m) |
| C2 | 2–24h (Caso B) | Conferma immediata, stessa escalation |
| C3 | < 2h (Caso C/D/E) | Conferma immediata, escalation **istantanea** (no delay tra canali) |

---

## D. AZIONI CLIENTE SULLA NOTIFICA

| ID | Azione cliente | Risultato atteso |
|----|---------------|-----------------|
| D1 | Clicca **"Annulla"** | Appuntamento → `cancelled`, flusso → `cancelled`, nodi pending → `skipped` |
| D2 | Clicca **"Sposta"** | Nuovo slot prenotato, vecchio cancellato, **nuovo flusso** parte per il nuovo appuntamento |
| D3 | Clicca **"Conferma presenza"** | ⚠️ NON deve apparire in Solo Conferma (riservato ai nodi reminder) |
| D4 | **Ignora** la notifica | Nessun follow-up (non ci sono nodi reminder in questo flusso) |

---

## E. SPOSTAMENTO DA ADMIN (Reschedule)

| ID | Scenario | Risultato atteso |
|----|----------|-----------------|
| E1 | Admin sposta evento, "Reinvia conferma" = **ON** | Vecchio flusso → `cancelled`, nodi pending → `skipped`, **nuovo flusso** parte |
| E2 | Admin sposta evento, "Reinvia conferma" = **OFF** | Vecchio flusso → `cancelled`, **nessun nuovo flusso** creato |
| E3 | Admin sposta **2 volte in rapida successione** | Solo l'ultimo flusso è `active`, i precedenti tutti `cancelled` |
| E4 | Admin sposta dopo che push è già stata consegnata | Push già inviata rimane nel log, nuovo flusso riparte da zero |

---

## F. CANCELLAZIONE

| ID | Scenario | Risultato atteso |
|----|----------|-----------------|
| F1 | Admin cancella **prima** dell'invio notifica | Flusso → `cancelled`, nodi → `skipped`, nessuna notifica parte |
| F2 | Admin cancella **dopo** invio notifica | Flusso → `cancelled`, nodi pending restanti → `skipped` |
| F3 | Cliente cancella dal portale | Stesso di F2 + appuntamento → `cancelled` + `deleted_at` popolato |

---

## G. VERIFICA UI

| ID | Dove | Cosa verificare |
|----|------|----------------|
| G1 | **Coda Notifiche** (Flussi) | Flusso visibile, nodi coerenti, nodi `skipped` nascosti |
| G2 | **Coda Notifiche** (Super Admin) | Colonna "Centro" mostra il nome del salone corretto |
| G3 | **Modifica Evento** (dialog agenda) | Template grafico mostra lo stato del flusso (nodi inviati/pending) |
| G4 | **Agenda** — badge conferma | Se il cliente conferma → spunta verde ✓ con tooltip orario |
| G5 | **Agenda** — badge reschedule | Se il cliente sposta → icona ↻ arancione (NON se sposta l'admin) |
| G6 | **Template SMS** (anteprima) | Variabili sostituite correttamente nelle 3 preview (SMS, WA, Push) |

---

## H. EDGE CASES CRITICI

| ID | Scenario | Risultato atteso |
|----|----------|-----------------|
| H1 | Creo appuntamento, cambio flusso del centro a "Conferma + Reminder", creo nuovo appuntamento | Il primo mantiene Solo Conferma, il secondo usa il nuovo flusso |
| H2 | Super Admin modifica il template SMS del modello | La modifica si propaga a tutti i modelli semplici |
| H3 | Due admin diversi creano appuntamenti simultanei per lo stesso operatore/orario | Conflict detection blocca il secondo |
| H4 | Appuntamento per domani, cliente conferma, poi admin lo sposta a tra 30 minuti | Nuovo flusso con escalation istantanea (Caso C) |

---

## Riepilogo

| Sezione | N° test |
|---------|---------|
| A – Creazione | 4 metodi |
| B – Canali notifica | 6 |
| C – Timing | 3 |
| D – Azioni cliente | 4 |
| E – Reschedule admin | 4 |
| F – Cancellazione | 3 |
| G – Verifica UI | 6 |
| H – Edge cases | 4 |
| **Totale** | **~30 test case** |

> Per i flussi "Conferma + Reminder" e "Solo Reminder" si aggiungono i test specifici dei nodi reminder (SMS1, SMS2, follow-up 20min, conferma presenza, ecc.).
