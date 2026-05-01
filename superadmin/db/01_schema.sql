-- ============================================================================
-- TheraFlow — Schema database
-- ============================================================================
-- Esegui questo SQL nel "SQL Editor" di Supabase (la prima volta).
-- Crea tutte le tabelle e gli indici. Dopo questo, esegui 02_policies.sql.
-- ============================================================================

-- Estensioni utili
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES — estende auth.users di Supabase con info applicative
-- ============================================================================
-- auth.users ha già: id, email, created_at, ecc.
-- Qui aggiungiamo: nome, ruolo globale, avatar color, ecc.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text not null,
  avatar_color    text not null default 'cyan',     -- chiave nel colorMap del frontend
  global_role     text not null default 'user' check (global_role in ('superadmin', 'user')),
  last_seen_at    timestamptz default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_global_role on public.profiles(global_role);

-- ============================================================================
-- 2. WORKSPACES — un workspace per ogni cliente
-- ============================================================================
create table if not exists public.workspaces (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  slug              text not null unique,
  owner_id          uuid not null references public.profiles(id) on delete restrict,

  status            text not null default 'active'
                    check (status in ('active', 'trial', 'paused', 'suspended')),
  plan              text not null default 'free'
                    check (plan in ('free', 'starter', 'growth', 'scale', 'enterprise')),

  badge             text,                              -- es. 'INTERNAL'
  monthly_revenue   integer not null default 0,        -- in centesimi? no — in euro interi per semplicità
  storage_mb        integer not null default 0,
  storage_limit_mb  integer not null default 1024,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_workspaces_owner_id on public.workspaces(owner_id);
create index if not exists idx_workspaces_slug on public.workspaces(slug);
create index if not exists idx_workspaces_status on public.workspaces(status);

-- ============================================================================
-- 3. WORKSPACE_MEMBERS — chi appartiene a quale workspace e con quale ruolo
-- ============================================================================
create table if not exists public.workspace_members (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text not null default 'staff' check (role in ('admin', 'staff')),
  created_at      timestamptz not null default now(),

  unique(workspace_id, user_id)
);

create index if not exists idx_members_workspace on public.workspace_members(workspace_id);
create index if not exists idx_members_user on public.workspace_members(user_id);

-- ============================================================================
-- 4. PROJECTS — i siti/funnel/landing dentro ogni workspace
-- ============================================================================
create table if not exists public.projects (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,

  name            text not null,
  slug            text not null,
  category        text not null default 'Generico',  -- libera, decisa dall'admin
  status          text not null default 'draft'
                  check (status in ('live', 'draft', 'deploying', 'archived')),

  subdomain       text not null,                      -- xxx.theraflow.io
  custom_domain   text,                               -- www.cliente.it (opzionale)

  -- Metriche cache (aggiornate da job o trigger)
  visits_30d      integer not null default 0,
  leads_30d       integer not null default 0,
  revenue_30d     integer not null default 0,

  tech_stack      text[] not null default '{}',
  last_deploy_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(workspace_id, slug),
  unique(subdomain)
);

create index if not exists idx_projects_workspace on public.projects(workspace_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_category on public.projects(category);

-- ============================================================================
-- 5. PROJECT_PAGES — le pagine di ogni sito (modificabili via UI)
-- ============================================================================
-- L'idea: ogni pagina ha una `content` JSON che descrive blocchi/sezioni.
-- Il frontend pubblico legge questi JSON e renderizza.
-- L'admin del workspace modifica i JSON via builder visuale.
create table if not exists public.project_pages (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,

  slug            text not null,                       -- '/', '/about', '/contatti'
  title           text not null,
  content         jsonb not null default '{}'::jsonb,  -- blocchi/sezioni serializzati
  seo             jsonb not null default '{}'::jsonb,  -- meta title, description, og:image
  published       boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(project_id, slug)
);

create index if not exists idx_pages_project on public.project_pages(project_id);

-- ============================================================================
-- 6. PROJECT_LEADS — i lead raccolti dai form dei siti
-- ============================================================================
create table if not exists public.project_leads (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,

  email           text,
  name            text,
  phone           text,
  source          text,                                 -- es. 'landing-aromafit'
  data            jsonb not null default '{}'::jsonb,   -- campi extra del form
  status          text not null default 'new'
                  check (status in ('new', 'contacted', 'won', 'lost')),

  created_at      timestamptz not null default now()
);

create index if not exists idx_leads_project on public.project_leads(project_id);
create index if not exists idx_leads_created on public.project_leads(created_at desc);

-- ============================================================================
-- 7. ACTIVITY — log eventi di tutti i workspace
-- ============================================================================
create table if not exists public.activity (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid references public.workspaces(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete set null,
  actor_id        uuid references public.profiles(id) on delete set null,

  type            text not null
                  check (type in ('deploy', 'invite', 'domain', 'billing', 'alert', 'create', 'update', 'delete', 'login')),
  message         text not null,
  metadata        jsonb default '{}'::jsonb,

  created_at      timestamptz not null default now()
);

create index if not exists idx_activity_workspace on public.activity(workspace_id);
create index if not exists idx_activity_created on public.activity(created_at desc);
create index if not exists idx_activity_type on public.activity(type);

-- ============================================================================
-- 8. INVITES — inviti pendenti
-- ============================================================================
create table if not exists public.invites (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  email           text not null,
  role            text not null default 'staff' check (role in ('admin', 'staff')),
  invited_by      uuid references public.profiles(id) on delete set null,
  token           text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at      timestamptz not null default (now() + interval '7 days'),
  accepted_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_invites_email on public.invites(email);
create index if not exists idx_invites_workspace on public.invites(workspace_id);
create index if not exists idx_invites_token on public.invites(token);

-- ============================================================================
-- 9. TRIGGER: auto-update updated_at
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_workspaces_updated   on public.workspaces;
drop trigger if exists trg_projects_updated     on public.projects;
drop trigger if exists trg_pages_updated        on public.project_pages;
drop trigger if exists trg_profiles_updated     on public.profiles;

create trigger trg_workspaces_updated  before update on public.workspaces
  for each row execute function public.touch_updated_at();
create trigger trg_projects_updated    before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger trg_pages_updated       before update on public.project_pages
  for each row execute function public.touch_updated_at();
create trigger trg_profiles_updated    before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 10. TRIGGER: crea profilo automaticamente quando si registra un nuovo utente
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, avatar_color, global_role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', 'cyan'),
    'user'
  );
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
