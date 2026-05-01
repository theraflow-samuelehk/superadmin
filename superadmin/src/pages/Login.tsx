import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { BrandMark } from "../components/ui/Brand";
import { useAuth } from "../lib/auth";

interface LocationState {
  from?: string;
  error?: string;
}

type Mode = "signin" | "signup";

const PILLS = ["Pagine & Funnel", "Lead & Analytics", "Domini custom", "Pubblica in un click"];

const STATS = [
  { v: "0€", l: "Per iniziare" },
  { v: "24/7", l: "Online" },
  { v: "∞", l: "Progetti" },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signIn, signUp, signOut,
    configured, session, profile,
    loading: authLoading, isSuperAdmin,
  } = useAuth();

  const locationState = (location.state ?? {}) as LocationState;
  const redirectTo = locationState.from ?? null;

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(locationState.error ?? null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !session || !profile) return;
    if (isSuperAdmin) {
      navigate(redirectTo ?? "/", { replace: true });
    } else {
      navigate(redirectTo ?? "/app", { replace: true });
    }
  }, [authLoading, session, profile, isSuperAdmin, navigate, redirectTo]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!configured) { navigate("/", { replace: true }); return; }
    if (mode === "signin") {
      if (!password) { setError("Inserisci la password."); return; }
      setSubmitting(true);
      const { error: err } = await signIn(email, password);
      setSubmitting(false);
      if (err) setError(err);
    } else {
      if (!name.trim()) { setError("Inserisci il tuo nome."); return; }
      if (!workspaceName.trim()) { setError("Dai un nome al tuo workspace."); return; }
      if (password.length < 6) { setError("La password deve avere almeno 6 caratteri."); return; }
      setSubmitting(true);
      const { error: err } = await signUp({ email, password, name, workspaceName });
      setSubmitting(false);
      if (err) {
        if (err.startsWith("Account creato")) { setInfo(err); void signOut(); }
        else setError(err);
      }
    }
  }

  function switchMode(m: Mode) { setMode(m); setError(null); setInfo(null); }

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-[1.15fr_1fr] overflow-hidden bg-white">

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — desktop only
      ══════════════════════════════════════════════════════ */}
      <div
        className="relative hidden lg:flex flex-col p-16 overflow-hidden text-white"
        style={{
          backgroundImage: `
            radial-gradient(at 2% 2%,   rgba(6,182,212,0.6)  0px, transparent 48%),
            radial-gradient(at 98% 5%,  rgba(59,130,246,0.55) 0px, transparent 52%),
            radial-gradient(at 75% 85%, rgba(99,102,241,0.45) 0px, transparent 52%),
            radial-gradient(at 5% 95%,  rgba(56,189,248,0.35) 0px, transparent 48%),
            linear-gradient(150deg, #040c1a 0%, #080f20 55%, #060b1c 100%)
          `,
        }}
      >
        {/* sfere glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/8 blur-2xl" />
        </div>

        {/* logo */}
        <div className="relative flex items-center gap-3">
          <BrandMark size={44} />
          <div>
            <div className="font-bold text-white text-[19px] tracking-tight">TheraFlow</div>
            <div className="text-[9.5px] uppercase tracking-[0.22em] text-white/45 font-bold">Studio</div>
          </div>
        </div>

        {/* main copy */}
        <div className="relative flex-1 flex flex-col justify-center py-16">

          {/* eyebrow */}
          <div className="flex items-center gap-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10.5px] uppercase tracking-[0.18em] font-bold text-white/50">
              Tutto ciò che ti serve, in un posto solo
            </span>
          </div>

          {/* headline */}
          <h1
            className="font-black text-white leading-[0.9] tracking-tight"
            style={{ fontSize: "clamp(54px, 6.5vw, 88px)" }}
          >
            Costruisci.<br />
            Pubblica.<br />
            <span
              className="italic font-extralight"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Cresci.
            </span>
          </h1>

          {/* body */}
          <p className="mt-10 text-[15.5px] text-white/55 leading-[1.75] max-w-[340px]">
            TheraFlow è la piattaforma per chi lavora online.
            Crea siti e landing page, raccogli contatti, monitora le performance —
            senza toccare una riga di codice.
          </p>

          {/* pill tags */}
          <div className="flex flex-wrap gap-2 mt-9">
            {PILLS.map((p) => (
              <span
                key={p}
                className="text-[11.5px] px-3 py-1.5 rounded-full border border-white/12 bg-white/6 text-white/60 font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* stats */}
        <div className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-7">
          {STATS.map((s) => (
            <div key={s.l}>
              <div className="font-black text-white tabular-nums leading-none text-[38px]">{s.v}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/38 mt-2 font-bold">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE HERO — full bleed, impatto forte
      ══════════════════════════════════════════════════════ */}
      <div
        className="lg:hidden relative flex flex-col overflow-hidden text-white"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%,   rgba(6,182,212,0.65)  0px, transparent 55%),
            radial-gradient(at 100% 0%, rgba(59,130,246,0.55) 0px, transparent 55%),
            radial-gradient(at 60% 100%,rgba(99,102,241,0.4)  0px, transparent 50%),
            linear-gradient(150deg, #040c1a 0%, #080f20 100%)
          `,
        }}
      >
        {/* glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-blue-500/15 blur-3xl" />
        </div>

        {/* contenuto */}
        <div className="relative px-6 pt-8 pb-7">
          {/* logo + headline in riga */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <BrandMark size={32} className="drop-shadow-lg" />
              <div>
                <div className="font-bold text-white text-[16px] tracking-tight">TheraFlow</div>
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/55 font-bold">Studio</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {STATS.map((s) => (
                <div key={s.l} className="text-center">
                  <div className="font-black text-white text-[16px] tabular-nums leading-none">{s.v}</div>
                  <div className="text-[8px] uppercase tracking-[0.1em] text-white/38 font-bold mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* headline */}
          <h2 className="font-black text-white leading-[0.92] tracking-tight whitespace-nowrap" style={{ fontSize: "clamp(20px, 7.5vw, 36px)" }}>
            Costruisci. Pubblica. <span className="italic font-extralight text-white/38">Cresci.</span>
          </h2>

          {/* tagline */}
          <p className="mt-2.5 text-[12.5px] text-white/48 leading-relaxed">
            Siti, lead e analytics — tutto in un posto, senza codice.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FORM — destra desktop / sotto mobile
      ══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center px-5 sm:px-10 py-10 lg:py-0 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[360px]"
        >
          {/* Tab */}
          <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-2xl">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 text-[13px] py-2.5 rounded-xl font-semibold transition-all ${
                  mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {m === "signin" ? "Accedi" : "Registrati"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-7"
            >
              {mode === "signin" ? (
                <>
                  <h2 className="font-black text-slate-900 text-[34px] leading-tight tracking-tight">
                    Bentornato.
                  </h2>
                  <p className="text-[13.5px] text-slate-400 mt-2 leading-relaxed">
                    Accedi al tuo workspace e riprendi da dove avevi lasciato.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-black text-slate-900 text-[34px] leading-tight tracking-tight">
                    Inizia gratis,<br />adesso.
                  </h2>
                  <p className="text-[13.5px] text-slate-400 mt-2 leading-relaxed">
                    Workspace pronto in 60 secondi. Nessuna carta richiesta.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Demo */}
          {!configured && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-[12.5px] text-amber-800 leading-relaxed">
              <strong className="font-bold">Modalità demo</strong> — backend non configurato.
              Clicca il pulsante per entrare con dati di esempio.
            </div>
          )}

          {/* Errore */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-[12.5px] text-rose-700"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Info */}
          {info && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-[12.5px] text-emerald-700"
            >
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>{info}</span>
            </motion.div>
          )}

          {/* Campi */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-3.5 overflow-hidden"
                >
                  <FormField label="Il tuo nome" type="text" value={name} onChange={setName}
                    placeholder="Mario Rossi" autoComplete="name" required />
                  <FormField label="Nome workspace" type="text" value={workspaceName} onChange={setWorkspaceName}
                    placeholder="es. Rossi Agency, Brand X…" required />
                </motion.div>
              )}
            </AnimatePresence>

            <FormField label="Email" type="email" value={email} onChange={setEmail}
              placeholder="tu@email.com" autoComplete="email" required />

            {configured && (
              <FormField
                label={mode === "signup" ? "Password (min. 6 caratteri)" : "Password"}
                type="password" value={password} onChange={setPassword}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
              />
            )}

            <div className="pt-1.5">
              <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={submitting}>
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" />{mode === "signin" ? "Accesso…" : "Creo il workspace…"}</>
                ) : (
                  <>
                    {!configured ? "Entra in demo" : mode === "signin" ? "Accedi" : "Crea workspace"}
                    <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="text-center text-[12px] text-slate-400 mt-6">
            {mode === "signin" ? (
              <>Nessun account?{" "}
                <button type="button" onClick={() => switchMode("signup")}
                  className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors">
                  Registrati gratis
                </button>
              </>
            ) : (
              <>Hai già un account?{" "}
                <button type="button" onClick={() => switchMode("signin")}
                  className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors">
                  Accedi
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function FormField({ label, type, value, onChange, placeholder, autoComplete, required }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
        {label}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} required={required}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 placeholder-slate-300 outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 font-medium transition-all"
      />
    </div>
  );
}
