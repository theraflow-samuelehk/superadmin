import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { BrandMark } from "../components/ui/Brand";
import { useAuth } from "../lib/auth";

interface LocationState {
  from?: string;
  error?: string;
}

type Mode = "signin" | "signup";

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

  // Redirect intelligente quando session + profile sono pronti
  useEffect(() => {
    if (authLoading || !session || !profile) return;
    // Super admin → console super admin
    if (isSuperAdmin) {
      navigate(redirectTo ?? "/", { replace: true });
    } else {
      // Admin/staff → pannello cliente
      navigate(redirectTo ?? "/app", { replace: true });
    }
  }, [authLoading, session, profile, isSuperAdmin, navigate, redirectTo]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    // Modalità demo
    if (!configured) {
      navigate("/", { replace: true });
      return;
    }

    if (mode === "signin") {
      if (!password) {
        setError("Inserisci la password.");
        return;
      }
      setSubmitting(true);
      const { error: err } = await signIn(email, password);
      setSubmitting(false);
      if (err) setError(err);
      // Il redirect lo fa l'useEffect quando profile è pronto
    } else {
      // signup
      if (!name.trim()) { setError("Inserisci il tuo nome."); return; }
      if (!workspaceName.trim()) { setError("Inserisci il nome del tuo workspace."); return; }
      if (password.length < 6) { setError("La password deve avere almeno 6 caratteri."); return; }

      setSubmitting(true);
      const { error: err } = await signUp({ email, password, name, workspaceName });
      setSubmitting(false);

      if (err) {
        // Se l'errore è "Account creato, conferma email…" lo mostriamo come info
        if (err.startsWith("Account creato")) {
          setInfo(err);
          // signOut per pulire eventuale sessione parziale
          void signOut();
        } else {
          setError(err);
        }
      }
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.2fr_1fr] relative overflow-hidden bg-white">
      {/* Left: gradient hero */}
      <div className="relative hidden lg:flex flex-col p-12 overflow-hidden text-white"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%,   rgba(6, 182, 212, 0.5)  0px, transparent 55%),
            radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.5) 0px, transparent 55%),
            radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.4) 0px, transparent 55%),
            radial-gradient(at 0% 100%, rgba(56, 189, 248, 0.45) 0px, transparent 50%),
            linear-gradient(160deg, #0a1628 0%, #0e1d3a 60%, #0c1440 100%)
          `,
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-[15%] right-[10%] w-48 h-48 rounded-full bg-cyan-400/30 blur-3xl" />
        </div>

        <div className="flex items-center gap-3 mb-auto relative">
          <BrandMark size={44} />
          <div className="leading-tight">
            <div className="heading-md text-white" style={{ fontSize: "18px" }}>TheraFlow</div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/80 font-bold">
              Studio Hub · Operations
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-[11px] uppercase tracking-wider font-bold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            La piattaforma all-in-one
          </div>
          <h1 className="display-tight font-bold" style={{ fontSize: "clamp(56px, 8.5vw, 116px)" }}>
            Tutti i clienti.
            <br />
            Ogni progetto.
            <br />
            <span className="text-white/70 font-light">Da un solo posto.</span>
          </h1>
          <p className="mt-7 max-w-md text-[15px] text-white/80 leading-relaxed">
            TheraFlow ti dà un workspace dove costruisci siti, funnel, landing senza scrivere codice.
            Trascina, scrivi, pubblica.
          </p>

          <ul className="mt-8 space-y-3 max-w-sm">
            {[
              "Builder visuale con blocchi pronti",
              "Sottodominio gratis o dominio tuo",
              "Lead, visite, fatturato in tempo reale",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] text-white/90">
                <span className="w-5 h-5 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-6 border-t border-white/20 pt-6 relative">
          {[
            { v: "3+", l: "Workspace" },
            { v: "10+", l: "Progetti" },
            { v: "Beta", l: "Status" },
          ].map((m) => (
            <div key={m.l}>
              <div className="font-display text-[36px] text-white font-bold tabular-nums leading-none">
                {m.v}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-white/70 mt-1.5 font-semibold">
                {m.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: login/signup form */}
      <div className="flex items-center justify-center px-8 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <BrandMark size={44} />
            <span className="heading-md text-slate-900" style={{ fontSize: "18px" }}>TheraFlow</span>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 mb-7 bg-slate-100/70 p-1 rounded-xl w-fit">
            <button
              onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
              className={`text-[13px] px-4 py-1.5 rounded-lg transition-all font-semibold ${
                mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Accedi
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
              className={`text-[13px] px-4 py-1.5 rounded-lg transition-all font-semibold ${
                mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Registrati
            </button>
          </div>

          {mode === "signin" ? (
            <>
              <h2 className="display-md text-[40px] text-slate-900 font-bold mb-3">
                Bentornato.
              </h2>
              <p className="text-[14px] text-slate-600 mb-8 leading-relaxed">
                Entra nel tuo workspace TheraFlow.
              </p>
            </>
          ) : (
            <>
              <h2 className="display-md text-[40px] text-slate-900 font-bold mb-3">
                Inizia gratis.
              </h2>
              <p className="text-[14px] text-slate-600 mb-8 leading-relaxed">
                Crea il tuo workspace TheraFlow in 30 secondi. Nessuna carta richiesta.
              </p>
            </>
          )}

          {!configured && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[12.5px] text-amber-800 leading-relaxed">
              <strong className="font-bold">Modalità demo</strong> — Supabase non configurato.
              Premi {mode === "signin" ? "Accedi" : "Registrati"} per entrare con dati finti.
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[12.5px] text-rose-800">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[12.5px] text-emerald-800">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-bold">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mario Rossi"
                    autoComplete="name"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:bg-white focus:shadow-glow font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-bold">
                    Nome del tuo workspace
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Studio Mario Rossi"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:bg-white focus:shadow-glow font-medium transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-bold">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="tu@studio.it"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:bg-white focus:shadow-glow font-medium transition-all"
              />
            </div>

            {configured && (
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-bold">
                  Password {mode === "signup" && <span className="text-slate-400 font-normal normal-case tracking-normal text-[10.5px]">(min 6 caratteri)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:bg-white focus:shadow-glow font-medium transition-all"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> {mode === "signin" ? "Accesso…" : "Registrazione…"}
                </>
              ) : (
                <>
                  {!configured ? "Entra in modalità demo" : mode === "signin" ? "Accedi" : "Crea workspace"}
                  <ArrowRight size={15} />
                </>
              )}
            </Button>

            <div className="border-t border-slate-100 pt-5 mt-5 text-[12px] text-slate-500 leading-relaxed text-center">
              {mode === "signin" ? (
                <>Non hai un account? <button type="button" onClick={() => setMode("signup")} className="text-cyan-600 font-semibold hover:text-cyan-700">Registrati gratis</button></>
              ) : (
                <>Hai già un account? <button type="button" onClick={() => setMode("signin")} className="text-cyan-600 font-semibold hover:text-cyan-700">Accedi</button></>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
