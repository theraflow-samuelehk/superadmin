import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
  Shield,
  LogOut,
  Map as MapIcon,
  Bookmark,
  MessageCircle,
  Filter as FilterIcon,
  Save,
  Download,
  Search,
  Star,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  Trash2,
  FolderOpen,
  RotateCcw,
  X,
} from 'lucide-react';
import type { Lead } from './types';

type Tab = 'mappa' | 'lead' | 'template';

const PAGE_SIZE = 100;
const VIEWS_KEY = 'admin_views_v2';

const STATUS_LABELS: Record<string, string> = {
  da_contattare: 'Da contattare',
  contattato: 'Contattato',
  in_trattativa: 'In trattativa',
  cliente: 'Cliente',
  scartato: 'Scartato',
};

interface Filters {
  q: string;
  status: string;
  category: string;
  province: string;
  region: string;
  minReviews: string;
  maxReviews: string;
  ratingMin: string;
  ratingMax: string;
  website: string;
  negReviews: string;
  telefono: string;
}

interface SavedView {
  id: string;
  name: string;
  filters: Filters;
  count: number;
  createdAt: string;
}

const EMPTY_FILTERS: Filters = {
  q: '',
  status: '',
  category: '',
  province: '',
  region: '',
  minReviews: '',
  maxReviews: '',
  ratingMin: '0',
  ratingMax: '5',
  website: '',
  negReviews: '',
  telefono: '',
};

function loadViews(): SavedView[] {
  try {
    return JSON.parse(localStorage.getItem(VIEWS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveViews(views: SavedView[]) {
  localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('lead');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showViews, setShowViews] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [views, setViews] = useState<SavedView[]>(loadViews);

  useEffect(() => {
    fetch('/leads.csv')
      .then((r) => r.text())
      .then((text) => {
        const parsed = Papa.parse<Lead>(text, {
          header: true,
          skipEmptyLines: true,
        });
        setLeads(parsed.data.filter((l) => l.id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function logout() {
    sessionStorage.removeItem('admin_auth');
    navigate('/admin/login');
  }

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  const uniq = (key: keyof Lead) => {
    const s = new Set<string>();
    for (const l of leads) {
      const v = l[key];
      if (v && v.trim()) s.add(v);
    }
    return [...s].sort();
  };

  const statuses = useMemo(() => uniq('status'), [leads]);
  const categories = useMemo(() => uniq('category'), [leads]);
  const provinces = useMemo(() => uniq('province'), [leads]);
  const regions = useMemo(() => uniq('region'), [leads]);

  const filtered = useMemo(() => {
    const { q, status, category, province, region, minReviews, maxReviews, ratingMin, ratingMax, website, negReviews, telefono } = filters;
    const qq = q.trim().toLowerCase();
    const minR = minReviews ? parseInt(minReviews) : 0;
    const maxR = maxReviews ? parseInt(maxReviews) : Infinity;
    const rMin = parseFloat(ratingMin || '0');
    const rMax = parseFloat(ratingMax || '5');

    return leads.filter((l) => {
      if (qq) {
        const hay = `${l.business_name} ${l.address} ${l.city}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      if (status && l.status !== status) return false;
      if (category && l.category !== category) return false;
      if (province && l.province !== province) return false;
      if (region && l.region !== region) return false;

      const tr = parseInt(l.total_reviews || '0');
      if (tr < minR) return false;
      if (tr > maxR) return false;

      const rt = parseFloat(l.rating || '0');
      if (rt < rMin) return false;
      if (rt > rMax) return false;

      if (website === 'si' && l.has_website !== 't') return false;
      if (website === 'no' && l.has_website === 't') return false;

      if (negReviews === 'si' && (!l.negative_reviews || l.negative_reviews === '[]')) return false;
      if (negReviews === 'no' && l.negative_reviews && l.negative_reviews !== '[]') return false;

      if (telefono === 'si' && !l.phone) return false;
      if (telefono === 'no' && l.phone) return false;

      return true;
    });
  }, [leads, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageLeads = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function downloadCSV(data: Lead[], filename: string) {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCurrentCSV() {
    downloadCSV(filtered, `leads_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function saveCurrentView() {
    const name = prompt('Nome vista (es. "Sicilia 4+ stelle"):');
    if (!name?.trim()) return;
    const view: SavedView = {
      id: crypto.randomUUID(),
      name: name.trim(),
      filters: { ...filters },
      count: filtered.length,
      createdAt: new Date().toISOString(),
    };
    const next = [...views, view];
    setViews(next);
    saveViews(next);
    setShowViews(true);
  }

  function loadView(v: SavedView) {
    setFilters(v.filters);
    setShowFilters(true);
  }

  function deleteView(id: string) {
    if (!confirm('Eliminare questa vista?')) return;
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    saveViews(next);
  }

  function exportView(v: SavedView) {
    const { q, status, category, province, region, minReviews, maxReviews, ratingMin, ratingMax, website, negReviews, telefono } = v.filters;
    const qq = q.trim().toLowerCase();
    const minR = minReviews ? parseInt(minReviews) : 0;
    const maxR = maxReviews ? parseInt(maxReviews) : Infinity;
    const rMin = parseFloat(ratingMin || '0');
    const rMax = parseFloat(ratingMax || '5');

    const data = leads.filter((l) => {
      if (qq) {
        const hay = `${l.business_name} ${l.address} ${l.city}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      if (status && l.status !== status) return false;
      if (category && l.category !== category) return false;
      if (province && l.province !== province) return false;
      if (region && l.region !== region) return false;
      const tr = parseInt(l.total_reviews || '0');
      if (tr < minR || tr > maxR) return false;
      const rt = parseFloat(l.rating || '0');
      if (rt < rMin || rt > rMax) return false;
      if (website === 'si' && l.has_website !== 't') return false;
      if (website === 'no' && l.has_website === 't') return false;
      if (negReviews === 'si' && (!l.negative_reviews || l.negative_reviews === '[]')) return false;
      if (negReviews === 'no' && l.negative_reviews && l.negative_reviews !== '[]') return false;
      if (telefono === 'si' && !l.phone) return false;
      if (telefono === 'no' && l.phone) return false;
      return true;
    });

    const safeName = v.name.replace(/[^a-z0-9-_]+/gi, '_');
    downloadCSV(data, `${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const hasActiveFilters =
    filters.q ||
    filters.status ||
    filters.category ||
    filters.province ||
    filters.region ||
    filters.minReviews ||
    filters.maxReviews ||
    filters.ratingMin !== '0' ||
    filters.ratingMax !== '5' ||
    filters.website ||
    filters.negReviews ||
    filters.telefono;

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <header className="border-b border-white/5 bg-[#0a0f1c]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-semibold">ReviewShield Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm hidden sm:inline">samuelehk@gmail.com</span>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        <div className="inline-flex bg-[#0f172a] border border-white/5 rounded-xl p-1.5 gap-1">
          <TabBtn active={tab === 'mappa'} onClick={() => setTab('mappa')} icon={<MapIcon className="w-4 h-4" />}>
            Mappa
          </TabBtn>
          <TabBtn active={tab === 'lead'} onClick={() => setTab('lead')} icon={<Bookmark className="w-4 h-4" />}>
            Lead Salvati
          </TabBtn>
          <TabBtn active={tab === 'template'} onClick={() => setTab('template')} icon={<MessageCircle className="w-4 h-4" />}>
            Template WA
          </TabBtn>
        </div>

        {tab === 'lead' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[280px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  value={filters.q}
                  onChange={(e) => updateFilter('q', e.target.value)}
                  placeholder="Cerca per nome o indirizzo..."
                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg px-4 py-2.5 flex items-center gap-2"
              >
                <FilterIcon className="w-4 h-4" />
                Filtri
              </button>
              <span className="text-white/70 text-sm">
                {loading ? 'Caricamento...' : `${filtered.length}/${leads.length} lead`}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-white/50 hover:text-white text-xs flex items-center gap-1"
                  title="Reset filtri"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowViews((s) => !s)}
                  className={`border rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 ${
                    showViews ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Viste
                  {views.length > 0 && (
                    <span className="bg-white/10 text-xs rounded-full px-2 py-0.5 ml-1">{views.length}</span>
                  )}
                </button>
                <button
                  onClick={saveCurrentView}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salva vista
                </button>
                <button
                  onClick={exportCurrentCSV}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>

            {showViews && (
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Viste salvate</h3>
                  <button
                    onClick={() => setShowViews(false)}
                    className="text-white/40 hover:text-white/70"
                    title="Chiudi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {views.length === 0 ? (
                  <p className="text-white/50 text-sm py-4 text-center">
                    Nessuna vista salvata. Imposta dei filtri e clicca "Salva vista".
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {views.map((v) => (
                      <ViewRow
                        key={v.id}
                        view={v}
                        onLoad={() => loadView(v)}
                        onExport={() => exportView(v)}
                        onDelete={() => deleteView(v.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {showFilters && (
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Select label="Status" value={filters.status} onChange={(v) => updateFilter('status', v)} options={statuses} labelMap={STATUS_LABELS} allLabel="Tutti" />
                <Select label="Categoria" value={filters.category} onChange={(v) => updateFilter('category', v)} options={categories} allLabel="Tutte" />
                <Select label="Provincia" value={filters.province} onChange={(v) => updateFilter('province', v)} options={provinces} allLabel="Tutte" />
                <Select label="Regione" value={filters.region} onChange={(v) => updateFilter('region', v)} options={regions} allLabel="Tutte" />
                <Num label="Min. rec." value={filters.minReviews} onChange={(v) => updateFilter('minReviews', v)} placeholder="0" />
                <Num label="Max. rec." value={filters.maxReviews} onChange={(v) => updateFilter('maxReviews', v)} placeholder="∞" />
                <Num label="Rating min" value={filters.ratingMin} onChange={(v) => updateFilter('ratingMin', v)} step="0.1" />
                <Num label="Rating max" value={filters.ratingMax} onChange={(v) => updateFilter('ratingMax', v)} step="0.1" />
                <Select label="Sito web" value={filters.website} onChange={(v) => updateFilter('website', v)} options={['si', 'no']} labelMap={{ si: 'Sì', no: 'No' }} allLabel="Tutti" />
                <Select label="Rec. neg." value={filters.negReviews} onChange={(v) => updateFilter('negReviews', v)} options={['si', 'no']} labelMap={{ si: 'Sì', no: 'No' }} allLabel="Tutti" />
                <Select label="Telefono" value={filters.telefono} onChange={(v) => updateFilter('telefono', v)} options={['si', 'no']} labelMap={{ si: 'Sì', no: 'No' }} allLabel="Tutti" />
              </div>
            )}

            <div className="grid gap-3">
              {loading && <div className="text-white/50 text-sm py-12 text-center">Caricamento lead...</div>}
              {!loading && pageLeads.length === 0 && (
                <div className="text-white/50 text-sm py-12 text-center">Nessun lead con questi filtri.</div>
              )}
              {pageLeads.map((l) => (
                <LeadCard key={l.id} lead={l} />
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-white/60 text-sm">
                Pagina {page} di {totalPages} ({filtered.length} lead)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-lg px-4 py-2 text-sm"
                >
                  ← Prec
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg px-4 py-2 text-sm"
                >
                  Succ →
                </button>
              </div>
            </div>
          </>
        )}

        {tab === 'mappa' && (
          <div className="bg-[#0f172a]/50 border border-white/5 rounded-xl p-12 text-center text-white/50 text-sm">
            Mappa dei lead — in arrivo.
          </div>
        )}
        {tab === 'template' && (
          <div className="bg-[#0f172a]/50 border border-white/5 rounded-xl p-12 text-center text-white/50 text-sm">
            Template WhatsApp — in arrivo.
          </div>
        )}
      </main>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
        active ? 'bg-emerald-500 text-white' : 'text-white/70 hover:bg-white/5'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labelMap,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labelMap?: Record<string, string>;
  allLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-[11px] uppercase tracking-wider font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labelMap?.[o] ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-[11px] uppercase tracking-wider font-medium">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
      />
    </div>
  );
}

function ViewRow({
  view,
  onLoad,
  onExport,
  onDelete,
}: {
  view: SavedView;
  onLoad: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const summary = buildSummary(view.filters);
  return (
    <div className="bg-[#0a0f1c] border border-white/5 hover:border-white/10 rounded-lg p-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{view.name}</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
            {view.count} lead
          </span>
        </div>
        <div className="text-white/50 text-xs mt-0.5 truncate">
          {summary || 'Nessun filtro'} · {new Date(view.createdAt).toLocaleDateString('it-IT')}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onLoad}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Carica
        </button>
        <button
          onClick={onExport}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
        <button
          onClick={onDelete}
          className="text-white/40 hover:text-red-400 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10"
          title="Elimina"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function buildSummary(f: Filters): string {
  const parts: string[] = [];
  if (f.q) parts.push(`"${f.q}"`);
  if (f.status) parts.push(STATUS_LABELS[f.status] ?? f.status);
  if (f.category) parts.push(f.category);
  if (f.province) parts.push(f.province);
  if (f.region) parts.push(f.region);
  if (f.minReviews) parts.push(`min ${f.minReviews} rec.`);
  if (f.maxReviews) parts.push(`max ${f.maxReviews} rec.`);
  if (f.ratingMin !== '0') parts.push(`★≥${f.ratingMin}`);
  if (f.ratingMax !== '5') parts.push(`★≤${f.ratingMax}`);
  if (f.website === 'si') parts.push('con sito');
  if (f.website === 'no') parts.push('senza sito');
  if (f.negReviews === 'si') parts.push('con rec. neg.');
  if (f.negReviews === 'no') parts.push('senza rec. neg.');
  if (f.telefono === 'si') parts.push('con tel');
  if (f.telefono === 'no') parts.push('senza tel');
  return parts.join(' · ');
}

function LeadCard({ lead }: { lead: Lead }) {
  const rating = parseFloat(lead.rating || '0');
  const reviews = parseInt(lead.total_reviews || '0');
  const hasNegative = lead.negative_reviews && lead.negative_reviews !== '[]';

  return (
    <div className="bg-[#0f172a] border border-white/5 hover:border-white/10 rounded-xl p-4 transition">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{lead.business_name}</h3>
            {lead.status && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/60">
                {STATUS_LABELS[lead.status] ?? lead.status}
              </span>
            )}
            {hasNegative && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                Rec. negative
              </span>
            )}
          </div>
          <div className="text-white/50 text-xs flex items-center gap-1.5 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{lead.address}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              {rating.toFixed(1)} · {reviews} rec.
            </span>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-emerald-400">
                <Phone className="w-3 h-3" />
                {lead.phone}
              </a>
            )}
            {lead.website && (
              <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-400">
                <Globe className="w-3 h-3" />
                Sito
              </a>
            )}
            {lead.category && <span className="text-white/40">{lead.category}</span>}
            {(lead.city || lead.province) && (
              <span className="text-white/40">
                {lead.city}
                {lead.province ? ` (${lead.province})` : ''}
              </span>
            )}
          </div>
        </div>
        {lead.google_maps_url && (
          <a
            href={lead.google_maps_url}
            target="_blank"
            rel="noreferrer"
            className="text-white/50 hover:text-white text-xs flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Maps
          </a>
        )}
      </div>
    </div>
  );
}
