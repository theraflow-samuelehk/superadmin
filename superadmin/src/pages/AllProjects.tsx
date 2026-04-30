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
      <div className="mb-8 pt-2">
        <div className="flex items-center gap-3 mb-5">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
          >
            03 — Progetti
          </span>
        </div>
        <h1
          className="font-display font-bold text-slate-900 tracking-monster leading-[1]"
          style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
        >
          <span className="gradient-text">{projects.length}</span> progetti, ovunque.
        </h1>
        <p className="mt-3 text-[15px] text-slate-600 max-w-xl">
          Visione trasversale su tutti i workspace. Le categorie sono libere — ognuna nasce dall'admin che la crea.
        </p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl px-3 py-2 mb-3 transition-all">
          <Search size={14} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca progetto…"
            className="flex-1 bg-transparent outline-none text-[13px] text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={cn(
                "text-[12px] px-3.5 py-1.5 rounded-full border transition-all font-semibold",
                activeCat === c
                  ? "bg-slate-900 text-white border-slate-900"
                  : "text-slate-600 bg-white border-slate-200 hover:border-violet-300 hover:text-violet-700"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((p, i) => {
          const ws = getWorkspace(p.workspaceId);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
            >
              <Card interactive className="p-5">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                      {p.category}
                    </div>
                    <div className="font-display text-[19px] text-slate-900 font-bold tracking-ultra-tight leading-tight">
                      {p.name}
                    </div>
                    <div className="text-[11.5px] text-slate-500 mt-1 font-medium">
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

                <div className="flex items-center gap-1.5 text-[12px] mb-4 bg-slate-50 px-3 py-2 rounded-lg">
                  <Globe size={12} className="text-slate-400" />
                  {p.customDomain ? (
                    <span className="font-semibold gradient-text">{p.customDomain}</span>
                  ) : (
                    <span className="font-mono text-slate-600">{p.subdomain}.workspace.io</span>
                  )}
                  <ExternalLink size={11} className="text-slate-400 ml-auto" />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <div className="font-display text-[17px] text-slate-900 font-bold tabular-nums">
                      {formatNumber(p.visits30d)}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                      Visite
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-[17px] text-slate-900 font-bold tabular-nums">
                      {formatNumber(p.leads30d)}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                      Lead
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-[17px] text-slate-900 font-bold tabular-nums">
                      {p.revenue30d ? formatCurrency(p.revenue30d) : "—"}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                      €/30gg
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-500 font-medium">
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
