import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Fingerprint } from "lucide-react";
import { Button } from "../components/ui/Button";

export function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-paper-50 grid lg:grid-cols-[1.3fr_1fr] relative overflow-hidden">
      {/* Left: editorial ambience */}
      <div className="relative hidden lg:flex flex-col p-12 hairline-r overflow-hidden">
        {/* Soft radial glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(900px 600px at 30% 30%, rgba(26, 37, 72, 0.08), transparent 60%)",
          }}
        />

        {/* Brand */}
        <div className="flex items-center gap-3 mb-auto relative">
          <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-lg shadow-accent">
            <span
              className="font-display text-paper-50 text-xl leading-none"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
            >
              w
            </span>
          </div>
          <div className="leading-tight">
            <div
              className="font-display text-lg text-ink-900 tracking-ultra-tight font-medium"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
            >
              workspace
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-accent font-semibold">
              Atelier · Operations
            </div>
          </div>
        </div>

        {/* Massive headline */}
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-7 font-semibold">
            Restricted Access — Super Admin Only
          </div>
          <h1
            className="font-display font-light text-ink-900 tracking-monster leading-[0.85]"
            style={{ fontSize: "clamp(56px, 8vw, 116px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
          >
            Vedi ogni
            <br />
            <em className="text-accent not-italic">workspace.</em>
            <br />
            <span className="text-ink-200 font-light">Senza fretta.</span>
          </h1>
          <p className="mt-8 max-w-md text-[15px] text-ink-200 leading-relaxed">
            Una console privata per chi gestisce un palazzo di workspace. Niente è pubblico, niente è demo. Tutto è registrato.
          </p>
        </div>

        {/* Bottom hairline metrics */}
        <div className="mt-auto pt-12 grid grid-cols-3 gap-6 hairline-t pt-6 relative">
          {[
            { v: "7", l: "Workspaces" },
            { v: "18", l: "Projects" },
            { v: "10", l: "Users" },
          ].map((m) => (
            <div key={m.l}>
              <div
                className="font-display text-[34px] text-ink-900 font-light tabular-nums leading-none"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
              >
                {m.v}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink-100 mt-1.5 font-medium">
                {m.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center px-8 py-12 relative bg-white hairline-l">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-lg">
              <span className="font-display text-paper-50 text-xl leading-none">w</span>
            </div>
            <span className="font-display text-lg text-ink-900 font-medium">workspace</span>
          </div>

          <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-3 font-semibold">
            00 — Authentication
          </div>
          <h2
            className="font-display text-[42px] text-ink-900 font-light tracking-monster leading-tight mb-4"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
          >
            Accedi alla console.
          </h2>
          <p className="text-[14px] text-ink-200 mb-10 leading-relaxed">
            Solo email autorizzate. Per accessi speciali, contatta Samuele direttamente.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.16em] text-ink-100 mb-2 font-semibold">
                Email
              </label>
              <input
                type="email"
                defaultValue="samuelehk@gmail.com"
                className="w-full hairline rounded-md bg-paper-50 px-4 py-3 text-[14px] text-ink-500 outline-none focus:border-accent focus:bg-white font-medium transition-colors"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              onClick={() => navigate("/")}
            >
              <Fingerprint size={14} />
              Continua con SSO
              <ArrowRight size={14} />
            </Button>

            <div className="hairline-t pt-6 mt-6">
              <div className="text-[11px] text-ink-100 leading-relaxed">
                Sessioni protette via TOTP + audit log per ogni azione. Hardware key supportate.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
