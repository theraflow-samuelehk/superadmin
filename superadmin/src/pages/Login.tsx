import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "../components/ui/Button";
import { BrandMark } from "../components/ui/Brand";

export function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.2fr_1fr] relative overflow-hidden bg-white">
      {/* Left: gradient hero */}
      <div className="relative hidden lg:flex flex-col p-12 overflow-hidden text-white"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.85) 0px, transparent 55%),
            radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.75) 0px, transparent 55%),
            radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.65) 0px, transparent 55%),
            radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.7) 0px, transparent 55%),
            linear-gradient(135deg, #6d28d9, #be185d)
          `,
        }}
      >
        {/* Floating decorations */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-[15%] right-[10%] w-48 h-48 rounded-full bg-pink-400/30 blur-3xl" />
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3 mb-auto relative">
          <BrandMark size={44} />
          <div className="leading-tight">
            <div className="heading-md text-white" style={{ fontSize: "18px" }}>
              TheraFlow
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/80 font-bold">
              Studio Hub · Operations
            </div>
          </div>
        </div>

        {/* Massive headline */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-[11px] uppercase tracking-wider font-bold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Restricted Access · Super Admin
          </div>
          <h1
            className="display-tight font-bold"
            style={{ fontSize: "clamp(56px, 8.5vw, 116px)" }}
          >
            Il tuo studio,
            <br />
            in <em className="not-italic">flusso</em>.
            <br />
            <span className="text-white/70 font-light">Da un solo posto.</span>
          </h1>
          <p className="mt-7 max-w-md text-[15px] text-white/80 leading-relaxed">
            TheraFlow è la console di chi gestisce un palazzo di studi: workspace, progetti, domini e clienti.
            Niente è pubblico, niente è demo. Tutto è registrato, tutto è tracciabile.
          </p>

          <ul className="mt-8 space-y-3 max-w-sm">
            {[
              "Vedi tutti i workspace dei tuoi clienti",
              "Impersona qualunque admin con un click",
              "Audit log completo di ogni azione",
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

        {/* Bottom metrics */}
        <div className="mt-auto pt-12 grid grid-cols-3 gap-6 border-t border-white/20 pt-6 relative">
          {[
            { v: "7", l: "Workspaces" },
            { v: "18", l: "Projects" },
            { v: "10", l: "Users" },
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

      {/* Right: login form */}
      <div className="flex items-center justify-center px-8 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <BrandMark size={44} />
            <span className="heading-md text-slate-900" style={{ fontSize: "18px" }}>TheraFlow</span>
          </div>

          <div className="text-[11px] uppercase tracking-wider text-violet-600 mb-3 font-bold">
            Authentication
          </div>
          <h2 className="display-md text-[44px] text-slate-900 font-bold mb-4">
            Accedi a TheraFlow.
          </h2>
          <p className="text-[14.5px] text-slate-600 mb-10 leading-relaxed">
            Solo super admin autorizzati. Per accessi speciali, contatta direttamente il team TheraFlow.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-bold">
                Email
              </label>
              <input
                type="email"
                defaultValue="samuelehk@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-violet-400 focus:bg-white focus:shadow-glow font-medium transition-all"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              onClick={() => navigate("/")}
            >
              Continua con SSO
              <ArrowRight size={15} />
            </Button>

            <div className="border-t border-slate-100 pt-6 mt-6">
              <div className="text-[12px] text-slate-500 leading-relaxed">
                Sessioni protette via TOTP + audit log per ogni azione. Hardware key supportate.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
