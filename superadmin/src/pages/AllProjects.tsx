import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Globe, Search } from "lucide-react";
import { projects, getWorkspace } from "../lib/mock";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { formatCurrency, formatNumber, relativeTime, cn } from "../lib/utils";

export function AllProjects() {
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Tutte");

  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category));
    return ["Tutte", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (activeCat !== "Tutte" && p.category !== activeCat) return false;
      return true;
    });
  }, [q, activeCat]);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      <div className="mb-8 pt-4">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
            03 — Progetti
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-paper-300 to-transparent" />
        </div>
        <h1
          className="font-display font-light text-ink-900 tracking-monster leading-[0.95]"
          style={{ fontSize: "clamp(40px, 5vw, 60px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
        >
          {projects.length} progetti, ovunque.
        </h1>
        <p className="mt-3 text-[15px] text-ink-200 max-w-lg">
          Visione trasversale su tutti i workspace. Le categorie sono libere — ognuna nasce dall'admin che la crea.
        </p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3 hairline rounded-md bg-paper-50 px-3 py-2 mb-3">
          <Search size={13} className="text-ink-100" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca progetto…"
            className="flex-1 bg-transparent outline-none text-[13px] text-ink-400 placeholder:text-ink-100"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={cn(
                "text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border transition-colors font-medium",
                activeCat === c
                  ? "bg-accent text-paper-50 border-accent shadow-soft"
                  : "text-ink-200 hairline bg-white hover:border-accent/40 hover:text-accent"
              )}
            >
              {c}
              <span className="ml-1.5 opacity-60 tabular-nums">
                {c === "Tutte" ? projects.length : projects.filter((p) => p.category === c).length}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p, i) => {
          const ws = getWorkspace(p.workspaceId);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card interactive className="p-5">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-accent mb-1.5 font-semibold">
                      {p.category}
                    </div>
                    <div
                      className="font-display text-xl text-ink-900 font-normal tracking-ultra-tight"
                      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
                    >
                      {p.name}
                    </div>
                    <div className="text-[11px] text-ink-100 mt-1 font-medium">
                      {ws?.name}
                    </div>
                  </div>
                  <Badge
                    variant={
                      p.status === "live" ? "live"
                      : p.status === "deploying" ? "deploying"
                      : p.status === "draft" ? "draft"
                      : "archived"
                    }
                    dot
                  >
                    {p.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-ink-200 mb-4">
                  <Globe size={11} className="text-ink-100" />
                  {p.customDomain ? (
                    <span className="text-accent font-medium">{p.customDomain}</span>
                  ) : (
                    <span className="font-mono">{p.subdomain}.workspace.io</span>
                  )}
                  <ExternalLink size={10} className="text-ink-100 ml-auto" />
                </div>

                <div className="grid grid-cols-3 gap-3 hairline-t pt-3">
                  <div>
                    <div className="font-display text-base text-ink-900 font-normal tabular-nums" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
                      {formatNumber(p.visits30d)}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-ink-100 mt-0.5 font-medium">
                      Visite
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-base text-ink-900 font-normal tabular-nums" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
                      {formatNumber(p.leads30d)}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-ink-100 mt-0.5 font-medium">
                      Lead
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-base text-ink-900 font-normal tabular-nums" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
                      {p.revenue30d ? formatCurrency(p.revenue30d) : "—"}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-ink-100 mt-0.5 font-medium">
                      €/30gg
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[10px] uppercase tracking-[0.1em] text-ink-100 font-medium">
                  Deploy <span className="font-mono normal-case tracking-normal">{relativeTime(p.lastDeploy)}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
