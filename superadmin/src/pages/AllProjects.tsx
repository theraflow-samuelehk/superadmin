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
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-acid">
            03 / Progetti
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-acid/40 to-transparent" />
        </div>
        <h1
          className="font-display font-light text-ink-50 tracking-monster leading-[0.95]"
          style={{ fontSize: "clamp(40px, 5vw, 64px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
        >
          {projects.length} progetti, ovunque.
        </h1>
        <p className="mt-3 text-sm text-ink-300 max-w-lg">
          Visione trasversale su tutti i workspace. Le categorie sono libere — ognuna nasce dall'admin che la crea.
        </p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3 hairline rounded-sm bg-ink-950 px-3 py-2 mb-3">
          <Search size={13} className="text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca progetto…"
            className="flex-1 bg-transparent outline-none text-xs font-mono text-ink-100 placeholder:text-ink-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={cn(
                "text-[10px] font-mono uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm border transition-colors",
                activeCat === c
                  ? "bg-acid text-ink-950 border-acid"
                  : "text-ink-300 hairline hover:border-ink-500 hover:text-ink-100"
              )}
            >
              {c}
              <span className="ml-1.5 opacity-60">
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
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-acid mb-1">
                      {p.category}
                    </div>
                    <div
                      className="font-display text-xl text-ink-50 font-light tracking-ultra-tight"
                      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
                    >
                      {p.name}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 mt-1">
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

                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400 mb-4">
                  <Globe size={11} />
                  {p.customDomain ? (
                    <span className="text-acid">{p.customDomain}</span>
                  ) : (
                    <span>{p.subdomain}.workspace.io</span>
                  )}
                  <ExternalLink size={10} className="text-ink-500 ml-auto" />
                </div>

                <div className="grid grid-cols-3 gap-3 hairline-t pt-3">
                  <div>
                    <div className="font-display text-base text-ink-50 font-light tabular-nums">
                      {formatNumber(p.visits30d)}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-400 mt-0.5">
                      Visite
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-base text-ink-50 font-light tabular-nums">
                      {formatNumber(p.leads30d)}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-400 mt-0.5">
                      Lead
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-base text-ink-50 font-light tabular-nums">
                      {p.revenue30d ? formatCurrency(p.revenue30d) : "—"}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-400 mt-0.5">
                      €/30gg
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[9px] font-mono uppercase tracking-[0.14em] text-ink-500">
                  Deploy {relativeTime(p.lastDeploy)}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
