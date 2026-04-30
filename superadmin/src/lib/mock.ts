// Mock data layer — realistic fictional workspace ecosystem.

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

const COLORS = ["#d4ff4f", "#ff6b9d", "#4fd4ff", "#ffb347", "#b794f6", "#7ee787", "#f97583", "#ffd166"];

const d = (daysAgo: number, hoursAgo = 0) =>
  new Date(Date.now() - daysAgo * 86_400_000 - hoursAgo * 3_600_000);

export const users: User[] = [
  { id: "u_sam", name: "Samuele Cancemi", email: "samuelehk@gmail.com", avatarColor: "#d4ff4f", role: "superadmin", lastSeen: d(0, 0) },
  { id: "u_thomas", name: "Thomas Camilli", email: "thomas@camilli.dev", avatarColor: "#4fd4ff", role: "superadmin", lastSeen: d(0, 1) },
  { id: "u_giulia", name: "Giulia Marchetti", email: "giulia@studiomarchetti.it", avatarColor: "#ff6b9d", role: "admin", workspaceId: "ws_marchetti", lastSeen: d(0, 3) },
  { id: "u_luca", name: "Luca Bianchi", email: "luca.bianchi@nordico.studio", avatarColor: "#b794f6", role: "admin", workspaceId: "ws_nordico", lastSeen: d(1, 2) },
  { id: "u_chiara", name: "Chiara De Santis", email: "chiara@desantis.beauty", avatarColor: "#ffb347", role: "admin", workspaceId: "ws_desantis", lastSeen: d(0, 8) },
  { id: "u_marco", name: "Marco Russo", email: "marco@plantbased.life", avatarColor: "#7ee787", role: "admin", workspaceId: "ws_plantbased", lastSeen: d(2, 5) },
  { id: "u_sara", name: "Sara Greco", email: "sara@grecolaw.it", avatarColor: "#ffd166", role: "admin", workspaceId: "ws_grecolaw", lastSeen: d(0, 14) },
  { id: "u_alex", name: "Alex Romano", email: "alex@romanoresidence.it", avatarColor: "#f97583", role: "admin", workspaceId: "ws_romano", lastSeen: d(3, 0) },
  { id: "u_staff1", name: "Federica Conti", email: "fede@studiomarchetti.it", avatarColor: "#4fd4ff", role: "staff", workspaceId: "ws_marchetti", lastSeen: d(0, 4) },
  { id: "u_staff2", name: "Daniele Rizzo", email: "dani@nordico.studio", avatarColor: "#ff6b9d", role: "staff", workspaceId: "ws_nordico", lastSeen: d(0, 6) },
];

export const workspaces: Workspace[] = [
  { id: "ws_studio", name: "Studio Cancemi×Camilli", slug: "studio", ownerId: "u_sam", status: "active", plan: "enterprise", monthlyRevenue: 12450, createdAt: d(420), members: 4, storageMb: 1820, storageLimitMb: 10000, badge: "INTERNAL" },
  { id: "ws_marchetti", name: "Studio Marchetti Beauty", slug: "marchetti", ownerId: "u_giulia", status: "active", plan: "growth", monthlyRevenue: 4280, createdAt: d(180), members: 3, storageMb: 412, storageLimitMb: 2000 },
  { id: "ws_nordico", name: "Nordico Studio", slug: "nordico", ownerId: "u_luca", status: "active", plan: "scale", monthlyRevenue: 8910, createdAt: d(220), members: 5, storageMb: 1100, storageLimitMb: 5000 },
  { id: "ws_desantis", name: "De Santis Beauty Lab", slug: "desantis", ownerId: "u_chiara", status: "active", plan: "starter", monthlyRevenue: 1240, createdAt: d(95), members: 2, storageMb: 220, storageLimitMb: 500 },
  { id: "ws_plantbased", name: "PlantBased Life", slug: "plantbased", ownerId: "u_marco", status: "trial", plan: "free", monthlyRevenue: 0, createdAt: d(12), members: 1, storageMb: 84, storageLimitMb: 200 },
  { id: "ws_grecolaw", name: "Greco Studio Legale", slug: "grecolaw", ownerId: "u_sara", status: "active", plan: "starter", monthlyRevenue: 890, createdAt: d(140), members: 2, storageMb: 78, storageLimitMb: 500 },
  { id: "ws_romano", name: "Romano Residence", slug: "romano", ownerId: "u_alex", status: "paused", plan: "growth", monthlyRevenue: 0, createdAt: d(310), members: 3, storageMb: 640, storageLimitMb: 2000 },
];

export const projects: Project[] = [
  // Studio Cancemi×Camilli (internal)
  { id: "p_pannello", workspaceId: "ws_studio", name: "Pannello Progetti", slug: "pannello-progetti", category: "Tool Interni", status: "live", subdomain: "pannello", visits30d: 4280, leads30d: 0, lastDeploy: d(0, 6), createdAt: d(180), techStack: ["PHP", "Vanilla JS"] },
  { id: "p_rb", workspaceId: "ws_studio", name: "ReviewBooster", slug: "reviewbooster", category: "SaaS", status: "live", subdomain: "reviewbooster", customDomain: "reviewbooster.com", visits30d: 12340, leads30d: 89, revenue30d: 2840, lastDeploy: d(2), createdAt: d(140), techStack: ["PHP", "MySQL", "Tailwind"] },
  { id: "p_rs", workspaceId: "ws_studio", name: "ReviewShield", slug: "reviewshield", category: "SaaS", status: "live", subdomain: "reviewshield", visits30d: 8120, leads30d: 54, revenue30d: 1920, lastDeploy: d(5), createdAt: d(160), techStack: ["React", "Vite"] },
  { id: "p_rsb", workspaceId: "ws_studio", name: "ReviewShield Broad", slug: "reviewshield-broad", category: "SaaS", status: "draft", subdomain: "rs-broad", visits30d: 0, leads30d: 0, lastDeploy: d(20), createdAt: d(60), techStack: ["React"] },
  { id: "p_glow", workspaceId: "ws_studio", name: "Glow-Up", slug: "glow-up", category: "SaaS", status: "live", subdomain: "glow-up", visits30d: 3210, leads30d: 38, revenue30d: 1480, lastDeploy: d(1), createdAt: d(70), techStack: ["React", "Vite"] },
  { id: "p_glowwa", workspaceId: "ws_studio", name: "Glow-Up WhatsApp", slug: "glowup-whatsapp-service", category: "Microservice", status: "live", subdomain: "glow-wa", visits30d: 0, leads30d: 0, lastDeploy: d(8), createdAt: d(70), techStack: ["Node.js"] },
  { id: "p_aroma", workspaceId: "ws_studio", name: "Aromafit Landing", slug: "aromafit-landing", category: "Funnel & Landing", status: "live", subdomain: "aromafit", customDomain: "aromafit.it", visits30d: 28940, leads30d: 412, revenue30d: 6210, lastDeploy: d(3), createdAt: d(50), techStack: ["React", "Vite"] },
  // Marchetti
  { id: "p_funnel_lash", workspaceId: "ws_marchetti", name: "Funnel Lash Academy", slug: "funnel-lash", category: "Corsi", status: "live", subdomain: "lash", customDomain: "lashacademy.it", visits30d: 18420, leads30d: 287, revenue30d: 8210, lastDeploy: d(0, 12), createdAt: d(120), techStack: ["PHP"] },
  { id: "p_funnel_nails", workspaceId: "ws_marchetti", name: "Funnel Corso Unghie", slug: "funnel-nails", category: "Corsi", status: "live", subdomain: "nails", visits30d: 9840, leads30d: 124, revenue30d: 3920, lastDeploy: d(2), createdAt: d(90), techStack: ["PHP"] },
  { id: "p_funnel_seg", workspaceId: "ws_marchetti", name: "Funnel Segretarie", slug: "funnel-segretarie", category: "Corsi", status: "live", subdomain: "segretarie", visits30d: 6210, leads30d: 78, revenue30d: 2150, lastDeploy: d(4), createdAt: d(80), techStack: ["PHP"] },
  // Nordico
  { id: "p_fresh", workspaceId: "ws_nordico", name: "Fresh-IQ", slug: "fresh-iq", category: "Vetrina", status: "live", subdomain: "fresh-iq", customDomain: "fresh-iq.app", visits30d: 14820, leads30d: 0, lastDeploy: d(1), createdAt: d(160), techStack: ["React", "Vite"] },
  { id: "p_nordico_shop", workspaceId: "ws_nordico", name: "Nordico Shop", slug: "shop", category: "eCommerce", status: "live", subdomain: "shop", customDomain: "nordico.shop", visits30d: 24820, leads30d: 0, revenue30d: 18420, lastDeploy: d(0, 18), createdAt: d(100), techStack: ["Shopify-headless"] },
  { id: "p_nordico_blog", workspaceId: "ws_nordico", name: "Nordico Editoriale", slug: "blog", category: "Vetrina", status: "live", subdomain: "magazine", visits30d: 9120, leads30d: 0, lastDeploy: d(3), createdAt: d(80), techStack: ["Astro"] },
  // De Santis
  { id: "p_ds_landing", workspaceId: "ws_desantis", name: "Landing Trattamenti", slug: "trattamenti", category: "Funnel & Landing", status: "live", subdomain: "trattamenti", visits30d: 4210, leads30d: 64, lastDeploy: d(2), createdAt: d(40), techStack: ["HTML", "Tailwind"] },
  { id: "p_ds_book", workspaceId: "ws_desantis", name: "Booking Online", slug: "book", category: "Tool Interni", status: "deploying", subdomain: "book", visits30d: 0, leads30d: 0, lastDeploy: d(0, 0), createdAt: d(8), techStack: ["React"] },
  // PlantBased
  { id: "p_pb_landing", workspaceId: "ws_plantbased", name: "PlantBased Vetrina", slug: "home", category: "Vetrina", status: "draft", subdomain: "home", visits30d: 0, leads30d: 0, lastDeploy: d(10), createdAt: d(11), techStack: ["Next.js"] },
  // Greco Law
  { id: "p_gl_main", workspaceId: "ws_grecolaw", name: "Studio Greco Sito", slug: "site", category: "Vetrina", status: "live", subdomain: "site", customDomain: "grecolegale.it", visits30d: 1820, leads30d: 24, lastDeploy: d(15), createdAt: d(120), techStack: ["WordPress"] },
  // Romano
  { id: "p_rom_main", workspaceId: "ws_romano", name: "Romano Booking", slug: "booking", category: "eCommerce", status: "archived", subdomain: "booking", visits30d: 0, leads30d: 0, lastDeploy: d(60), createdAt: d(280), techStack: ["React"] },
];

export const activity: ActivityEvent[] = [
  { id: "a1", type: "deploy", workspaceId: "ws_marchetti", actor: "Giulia Marchetti", message: "Deploy live → lash.theraflow.io", timestamp: d(0, 0.2) },
  { id: "a2", type: "invite", workspaceId: "ws_nordico", actor: "Luca Bianchi", message: "Invitato dani@nordico.studio come Staff", timestamp: d(0, 1) },
  { id: "a3", type: "domain", workspaceId: "ws_studio", actor: "Samuele", message: "Dominio aromafit.it collegato", timestamp: d(0, 3) },
  { id: "a4", type: "billing", workspaceId: "ws_marchetti", actor: "Sistema", message: "Upgrade: Starter → Growth (+€49/mo)", timestamp: d(0, 4) },
  { id: "a5", type: "alert", workspaceId: "ws_plantbased", actor: "Sistema", message: "Trial scade fra 3 giorni", timestamp: d(0, 6) },
  { id: "a6", type: "create", workspaceId: "ws_desantis", actor: "Chiara De Santis", message: "Nuovo progetto: Booking Online", timestamp: d(0, 8) },
  { id: "a7", type: "deploy", workspaceId: "ws_studio", actor: "Thomas", message: "Hotfix deploy → reviewbooster", timestamp: d(0, 12) },
  { id: "a8", type: "invite", workspaceId: "ws_marchetti", actor: "Giulia Marchetti", message: "Invitato fede@studiomarchetti.it come Staff", timestamp: d(1, 2) },
  { id: "a9", type: "alert", workspaceId: "ws_romano", actor: "Sistema", message: "Workspace messo in pausa: pagamento fallito", timestamp: d(2, 0) },
  { id: "a10", type: "deploy", workspaceId: "ws_nordico", actor: "Daniele Rizzo", message: "Deploy production → shop", timestamp: d(2, 4) },
];

// Time series for charts (last 14 days)
export const platformTimeseries = Array.from({ length: 14 }, (_, i) => {
  const day = 13 - i;
  const base = 4200 + i * 180;
  return {
    date: new Date(Date.now() - day * 86_400_000).toISOString().slice(5, 10),
    visite: base + Math.floor(Math.random() * 1200),
    lead: 60 + i * 4 + Math.floor(Math.random() * 30),
    revenue: 800 + i * 40 + Math.floor(Math.random() * 200),
  };
});

export function getWorkspace(id: string) {
  return workspaces.find((w) => w.id === id);
}
export function getUser(id: string) {
  return users.find((u) => u.id === id);
}
export function projectsByWorkspace(id: string) {
  return projects.filter((p) => p.workspaceId === id);
}
export function membersByWorkspace(id: string) {
  return users.filter((u) => u.workspaceId === id);
}
export function activityByWorkspace(id: string) {
  return activity.filter((a) => a.workspaceId === id);
}

export const platformKPIs = {
  totalWorkspaces: workspaces.length,
  activeWorkspaces: workspaces.filter((w) => w.status === "active").length,
  totalProjects: projects.length,
  liveProjects: projects.filter((p) => p.status === "live").length,
  totalUsers: users.length,
  mrr: workspaces.reduce((sum, w) => sum + w.monthlyRevenue, 0),
  totalVisits30d: projects.reduce((s, p) => s + p.visits30d, 0),
  totalLeads30d: projects.reduce((s, p) => s + p.leads30d, 0),
  totalRevenue30d: projects.reduce((s, p) => s + (p.revenue30d || 0), 0),
};

export { COLORS };
