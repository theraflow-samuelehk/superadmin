import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Fingerprint } from "lucide-react";
import { Button } from "../components/ui/Button";

export function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-ink-950 grid lg:grid-cols-[1.3fr_1fr] relative overflow-hidden">
      {/* Left: visual ambience */}
      <div className="relative hidden lg:flex flex-col p-12 hairline-r grid-bg overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-x-0 h-32 scanline pointer-events-none animate-scan opacity-40" />

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-8 h-8 bg-acid flex items-center justify-center rounded-sm">
            <ShieldCheck size={16} className="text-ink-950" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg text-ink-50 tracking-ultra-tight" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}>
              workspace
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-acid">
              Operations Console
            </div>
          </div>
        </div>

        {/* Massive headline */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-acid mb-6">
            //  Restricted Access  //  Super Admin Only
          </div>
          <h1
            className="font-display font-light text-ink-50 tracking-monster leading-[0.85]"
            style={{ fontSize: "clamp(56px, 8vw, 120px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
          >
            See <em className="text-acid not-italic">every</em>
            <br />
            workspace.
            <br />
            <span className="text-ink-300">Quietly.</span>
          </h1>
          <p className="mt-8 max-w-md text-sm text-ink-300 leading-relaxed">
            Una console privata per chi gestisce un palazzo di workspace. Niente è pubblico, niente è demo. Tutto è logged.
          </p>
        </div>

        {/* Bottom hairline metrics */}
        <div className="mt-auto pt-12 grid grid-cols-3 gap-6 hairline-t pt-6">
          {[
            { v: "7", l: "Workspaces" },
            { v: "18", l: "Projects" },
            { v: "10", l: "Users" },
          ].map((m) => (
            <div key={m.l}>
              <div className="font-display text-3xl text-ink-50 font-light tabular-nums leading-none" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
                {m.v}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-400 mt-1">
                {m.l}
              </div>
            </div>
          ))}
        </div>

        {/* Decorative crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
          <div className="w-[600px] h-[600px] rounded-full border border-acid"></div>
          <div className="absolute inset-12 rounded-full border border-acid"></div>
          <div className="absolute inset-24 rounded-full border border-acid"></div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center px-8 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2.5 mb-12 lg:hidden">
            <div className="w-8 h-8 bg-acid flex items-center justify-center rounded-sm">
              <ShieldCheck size={16} className="text-ink-950" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg text-ink-50">workspace</span>
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-acid mb-3">
            00 / Authentication
          </div>
          <h2
            className="font-display text-4xl text-ink-50 font-light tracking-monster leading-tight mb-3"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
          >
            Accedi alla console.
          </h2>
          <p className="text-sm text-ink-300 mb-10">
            Solo email autorizzate. Per accessi speciali, contatta Samuele direttamente.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-ink-400 mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue="samuelehk@gmail.com"
                className="w-full hairline rounded-sm bg-ink-900 px-4 py-3 text-sm text-ink-50 outline-none focus:border-acid font-mono"
              />
            </div>

            <Button
              variant="acid"
              size="lg"
              className="w-full justify-center"
              onClick={() => navigate("/")}
            >
              <Fingerprint size={14} />
              Continua con SSO
              <ArrowRight size={14} />
            </Button>

            <div className="hairline-t pt-6 mt-6">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-ink-400 leading-relaxed">
                Sessioni protette via TOTP + audit log per ogni azione.
                <br />
                Hardware key supportate.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
