// Mock data — 3 workspace: 1 interno + 2 clienti demo.

export type Role = "superadmin" | "admin" | "staff";
export type ProjectStatus = "live" | "draft" | "archived" | "deploying";
export type WorkspaceStatus = "active" | "paused" | "trial" | "suspended";
export type Plan = "free" | "starter" | "growth" | "scale" | "enterprise";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  role: Role;
  workspaceId?: string;
  lastSeen: Date;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  category: string;
  status: ProjectStatus;
  subdomain: string;
  customDomain?: string;
  visits30d: number;
  leads30d: number;
  revenue30d?: number;
  lastDeploy: Date;
  createdAt: Date;
  techStack: string[];
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: WorkspaceStatus;
  plan: Plan;
  monthlyRevenue: number;
  createdAt: Date;
  members: number;
  storageMb: number;
  storageLimitMb: number;
  badge?: string;
}

export interface ActivityEvent {
  id: string;
  type: "deploy" | "invite" | "domain" | "billing" | "alert" | "create";
  workspaceId: string;
  actor: string;
  message: string;
  timestamp: Date;
}

const COLORS = ["#d4ff4f", "#ff6b9d", "#4fd4ff", "#ffb347", "#b794f6", "#7ee787"];

const d = (daysAgo: number, hoursAgo = 0) =>
  new Date(Date.now() - daysAgo * 86_400_000 - hoursAgo * 3_600_000);

// ─── Utenti ────────────────────────────────────────────────────────────────
export const users: User[] = [
  // Super Admin
  { id: "u_sam",    name: "Samuele Cancemi",  email: "samuelehk@gmail.com",          avatarColor: "#d4ff4f", role: "superadmin", lastSeen: d(0, 0) },
  { id: "u_thomas", name: "Thomas Camilli",   email: "thomas@camilli.dev",            avatarColor: "#4fd4ff", role: "superadmin", lastSeen: d(0, 1) },
  // Admin clienti
  { id: "u_giulia", name: "Giulia Marchetti", email: "giulia@studiomarchetti.it",     avatarColor: "#ff6b9d", role: "admin", workspaceId: "ws_marchetti", lastSeen: d(0, 3) },
  { id: "u_luca",   name: "Luca Bianchi",     email: "luca@nordico.studio",           avatarColor: "#b794f6", role: "admin", workspaceId: "ws_nordico",   lastSeen: d(1, 2) },
  // Staff clienti
  { id: "u_fede",   name: "Federica Conti",   email: "fede@studiomarchetti.it",       avatarColor: "#ffb347", role: "staff", workspaceId: "ws_marchetti", lastSeen: d(0, 4) },
  { id: "u_dani",   name: "Daniele Rizzo",    email: "daniele@nordico.studio",        avatarColor: "#7ee787", role: "staff", workspaceId: "ws_nordico",   lastSeen: d(0, 6) },
];

// ─── Workspace ─────────────────────────────────────────────────────────────
export const workspaces: Workspace[] = [
  {
    id: "ws_studio",
    name: "Cancemi × Camilli",
    slug: "studio",
    ownerId: "u_sam",
    status: "active",
    plan: "enterprise",
    monthlyRevenue: 12450,
    createdAt: d(420),
    members: 2,
    storageMb: 1820,
    storageLimitMb: 10000,
    badge: "INTERNAL",
  },
  {
    id: "ws_marchetti",
    name: "Studio Marchetti Beauty",
    slug: "marchetti",
    ownerId: "u_giulia",
    status: "active",
    plan: "growth",
    monthlyRevenue: 4280,
    createdAt: d(180),
    members: 2,
    storageMb: 412,
    storageLimitMb: 2000,
  },
  {
    id: "ws_nordico",
    name: "Nordico Studio",
    slug: "nordico",
    ownerId: "u_luca",
    status: "active",
    plan: "scale",
    monthlyRevenue: 8910,
    createdAt: d(220),
    members: 2,
    storageMb: 1100,
    storageLimitMb: 5000,
  },
];

// ─── Progetti ──────────────────────────────────────────────────────────────
export const projects: Project[] = [
  // Cancemi × Camilli (interno)
  { id: "p_rb",    workspaceId: "ws_studio",    name: "ReviewBooster",       slug: "reviewbooster",   category: "SaaS",            status: "live",      subdomain: "reviewbooster", customDomain: "reviewbooster.com",  visits30d: 12340, leads30d: 89,  revenue30d: 2840, lastDeploy: d(2),     createdAt: d(140), techStack: ["PHP", "MySQL"] },
  { id: "p_rs",    workspaceId: "ws_studio",    name: "ReviewShield",        slug: "reviewshield",    category: "SaaS",            status: "live",      subdomain: "reviewshield",  visits30d: 8120,  leads30d: 54,  revenue30d: 1920, lastDeploy: d(5),     createdAt: d(160), techStack: ["React", "Vite"] },
  { id: "p_glow",  workspaceId: "ws_studio",    name: "Glow-Up",             slug: "glow-up",         category: "SaaS",            status: "live",      subdomain: "glow-up",       visits30d: 3210,  leads30d: 38,  revenue30d: 1480, lastDeploy: d(1),     createdAt: d(70),  techStack: ["React", "Vite"] },
  { id: "p_aroma", workspaceId: "ws_studio",    name: "Aromafit Landing",    slug: "aromafit",        category: "Funnel & Landing", status: "live",      subdomain: "aromafit",      customDomain: "aromafit.it",        visits30d: 28940, leads30d: 412, revenue30d: 6210, lastDeploy: d(3),     createdAt: d(50),  techStack: ["React", "Vite"] },
  // Studio Marchetti Beauty
  { id: "p_lash",  workspaceId: "ws_marchetti", name: "Funnel Lash Academy", slug: "funnel-lash",     category: "Corsi",           status: "live",      subdomain: "lash",          customDomain: "lashacademy.it",     visits30d: 18420, leads30d: 287, revenue30d: 8210, lastDeploy: d(0, 12), createdAt: d(120), techStack: ["PHP"] },
  { id: "p_nails", workspaceId: "ws_marchetti", name: "Funnel Corso Unghie", slug: "funnel-nails",    category: "Corsi",           status: "live",      subdomain: "nails",         visits30d: 9840,  leads30d: 124, revenue30d: 3920, lastDeploy: d(2),     createdAt: d(90),  techStack: ["PHP"] },
  { id: "p_seg",   workspaceId: "ws_marchetti", name: "Funnel Segretarie",   slug: "funnel-segretarie", category: "Corsi",         status: "live",      subdomain: "segretarie",    visits30d: 6210,  leads30d: 78,  revenue30d: 2150, lastDeploy: d(4),     createdAt: d(80),  techStack: ["PHP"] },
  // Nordico Studio
  { id: "p_fresh", workspaceId: "ws_nordico",   name: "Fresh-IQ",            slug: "fresh-iq",        category: "Vetrina",         status: "live",      subdomain: "fresh-iq",      customDomain: "fresh-iq.app",       visits30d: 14820, leads30d: 0,   lastDeploy: d(1),     createdAt: d(160), techStack: ["React", "Vite"] },
  { id: "p_shop",  workspaceId: "ws_nordico",   name: "Nordico Shop",        slug: "shop",            category: "eCommerce",       status: "live",      subdomain: "shop",          customDomain: "nordico.shop",       visits30d: 24820, leads30d: 0,   revenue30d: 18420,lastDeploy: d(0, 18), createdAt: d(100), techStack: ["Shopify"] },
  { id: "p_blog",  workspaceId: "ws_nordico",   name: "Nordico Editoriale",  slug: "blog",            category: "Vetrina",         status: "live",      subdomain: "magazine",      visits30d: 9120,  leads30d: 0,   lastDeploy: d(3),     createdAt: d(80),  techStack: ["Astro"] },
];

// ─── Attività ──────────────────────────────────────────────────────────────
export const activity: ActivityEvent[] = [
  { id: "a1", type: "deploy",  workspaceId: "ws_marchetti", actor: "Giulia Marchetti", message: "Deploy live → lash.theraflow.io",               timestamp: d(0, 0.2) },
  { id: "a2", type: "billing", workspaceId: "ws_marchetti", actor: "Sistema",          message: "Piano aggiornato: Starter → Growth",             timestamp: d(0, 2) },
  { id: "a3", type: "domain",  workspaceId: "ws_studio",    actor: "Samuele",          message: "Dominio aromafit.it collegato al progetto",       timestamp: d(0, 3) },
  { id: "a4", type: "deploy",  workspaceId: "ws_studio",    actor: "Thomas",           message: "Hotfix deploy → reviewbooster.com",              timestamp: d(0, 6) },
  { id: "a5", type: "invite",  workspaceId: "ws_marchetti", actor: "Giulia Marchetti", message: "Membro invitato: fede@studiomarchetti.it",        timestamp: d(1, 1) },
  { id: "a6", type: "deploy",  workspaceId: "ws_nordico",   actor: "Daniele Rizzo",    message: "Deploy production → nordico.shop",               timestamp: d(1, 4) },
  { id: "a7", type: "create",  workspaceId: "ws_nordico",   actor: "Luca Bianchi",     message: "Nuovo progetto creato: Nordico Editoriale",       timestamp: d(2, 2) },
  { id: "a8", type: "domain",  workspaceId: "ws_nordico",   actor: "Luca Bianchi",     message: "Dominio nordico.shop verificato e attivo",        timestamp: d(3, 0) },
];

// ─── Time series chart (14gg) ──────────────────────────────────────────────
export const platformTimeseries = Array.from({ length: 14 }, (_, i) => {
  const day = 13 - i;
  const base = 4200 + i * 180;
  return {
    date: new Date(Date.now() - day * 86_400_000).toISOString().slice(5, 10),
    visite: base + Math.floor(Math.random() * 1200),
    lead:   60 + i * 4 + Math.floor(Math.random() * 30),
    revenue: 800 + i * 40 + Math.floor(Math.random() * 200),
  };
});

// ─── Helper functions ──────────────────────────────────────────────────────
export function getWorkspace(id: string) { return workspaces.find((w) => w.id === id); }
export function getUser(id: string) { return users.find((u) => u.id === id); }
export function projectsByWorkspace(id: string) { return projects.filter((p) => p.workspaceId === id); }
export function membersByWorkspace(id: string) { return users.filter((u) => u.workspaceId === id); }
export function activityByWorkspace(id: string) { return activity.filter((a) => a.workspaceId === id); }

// ─── KPI piattaforma ───────────────────────────────────────────────────────
export const platformKPIs = {
  totalWorkspaces:  workspaces.length,
  activeWorkspaces: workspaces.filter((w) => w.status === "active").length,
  totalProjects:    projects.length,
  liveProjects:     projects.filter((p) => p.status === "live").length,
  totalUsers:       users.length,
  mrr:              workspaces.reduce((sum, w) => sum + w.monthlyRevenue, 0),
  totalVisits30d:   projects.reduce((s, p) => s + p.visits30d, 0),
  totalLeads30d:    projects.reduce((s, p) => s + p.leads30d, 0),
  totalRevenue30d:  projects.reduce((s, p) => s + (p.revenue30d || 0), 0),
};

export { COLORS };
