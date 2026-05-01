# TheraFlow — Setup database (Ondata 2)

Guida passo-passo per collegare il superadmin a un database vero (Supabase).

Prima di iniziare l'app funziona già in **modalità demo** con dati finti — utile per vedere subito la grafica. Quando segui questi passi, l'app usa il database vero e il login funziona davvero.

---

## 1. Crea il progetto Supabase (5 minuti)

1. Vai su [supabase.com](https://supabase.com) → **Start your project**
2. Loggati con Google (o crea un account)
3. Clicca **New project**
   - Name: `theraflow`
   - Database password: generala lunga, **salvala** in un posto sicuro
   - Region: `Frankfurt (eu-central-1)` (più vicina all'Italia)
   - Plan: **Free**
4. Aspetta che il progetto sia pronto (1-2 minuti)

---

## 2. Copia le chiavi API

Una volta dentro al progetto:

1. Apri **Project Settings** (icona ingranaggio in basso a sinistra)
2. Vai in **API**
3. Copia:
   - **Project URL** (es. `https://xxxxx.supabase.co`)
   - **anon public** key (lunga stringa che inizia con `eyJ...`)

Crea un file `.env.local` nella root di `superadmin/` (copia da `.env.example`) e incolla:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

> ⚠️ Il file `.env.local` non va in git (è già escluso).

---

## 3. Crea le tabelle nel database

Sempre nella dashboard Supabase:

1. Apri **SQL Editor** (icona terminale a sinistra)
2. Clicca **+ New query**
3. Copia tutto il contenuto di [`db/01_schema.sql`](./01_schema.sql) e incollalo
4. Clicca **Run** (in basso a destra)

Ti dirà "Success. No rows returned" — perfetto.

Poi ripeti con:

5. **+ New query** → contenuto di [`db/02_policies.sql`](./02_policies.sql) → Run

---

## 4. Crea i 6 utenti di test

Sempre in Supabase, vai in **Authentication → Users → Add user → Create new user**.

Per ognuno: email + password (qualsiasi password >= 6 caratteri, segnatela).

| Email                          | Ruolo finale                  |
| ------------------------------ | ----------------------------- |
| `samuelehk@gmail.com`          | Super admin                   |
| `thomas@theraflow.io`          | Super admin                   |
| `giulia@studiomarchetti.it`    | Admin di Studio Marchetti     |
| `luca@nordico.studio`          | Admin di Nordico Studio       |
| `fede@studiomarchetti.it`      | Staff di Studio Marchetti     |
| `dani@nordico.studio`          | Staff di Nordico Studio       |

> Per la demo io userei la **stessa password** per tutti, tipo `theraflow2026`. In produzione ognuno userà la sua.

> Importante: **conferma le email automaticamente**. In Supabase: `Authentication → Settings → Auth Providers → Email → Confirm email = OFF` (per ora). Lo riattivi in produzione vera.

---

## 5. Carica i dati di prova (workspace, progetti, attività)

Dopo aver creato i 6 utenti, torna in **SQL Editor** e fai **+ New query** con il contenuto di [`db/03_seed.sql`](./03_seed.sql) → Run.

Crea: 3 workspace, 10 progetti, qualche evento di attività e 2 inviti pendenti.

---

## 6. Riavvia l'app

```bash
cd ~/workspace/superadmin
npm run dev
```

Apri il browser su http://localhost:5173

- Fai login con `samuelehk@gmail.com` + la password che hai messo
- Dovresti vedere il superadmin con i dati VERI dal database

Se torni in modalità demo: rimuovi (o commenta) le variabili in `.env.local` e ricarica.

---

## Cosa succede sotto il cofano

- **Auth**: gestita da Supabase. Email + password, sessione salvata nel browser, refresh token automatico.
- **RLS (Row Level Security)**: il database stesso decide cosa puoi leggere/scrivere in base a chi sei (super admin vede tutto, admin vede il suo workspace, staff vede solo i suoi progetti).
- **Niente backend custom**: il frontend parla direttamente con Supabase via la libreria `@supabase/supabase-js`. Niente Node.js, niente PHP, niente server.

---

## Prossimi step (Ondata 3)

- Rendering pubblico dei progetti (subdomini su `theraflow.io` o domini custom)
- Builder visuale per le pagine (drag-drop blocchi)
- Eventuale integrazione con Claude per modifiche via chat

---

## Troubleshooting

**"Invalid login credentials"** → controlla che l'utente sia stato creato in Supabase Authentication, non solo in `profiles`.

**"new row violates row-level security policy"** → l'utente loggato non ha i permessi giusti. Per testare se sei super admin: `select public.is_superadmin();` dal SQL Editor (deve dare `true`).

**App rimane in modalità demo** → controlla che `.env.local` sia nella root di `superadmin/` (non dentro `src/`) e che le variabili inizino con `VITE_`. Riavvia `npm run dev` dopo ogni cambio al file env.
