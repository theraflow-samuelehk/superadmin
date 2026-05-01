-- ============================================================================
-- TheraFlow — Project-level permissions
-- ============================================================================
-- Esegui nel SQL Editor di Supabase (dopo 02_policies.sql).
--
-- Aggiunge:
--   1. Tabella project_members  (chi può vedere/modificare un singolo progetto)
--   2. Helper is_project_member()
--   3. Aggiorna la policy SELECT su projects:
--        - superadmin       → tutto
--        - workspace admin  → tutti i progetti del workspace
--        - altri (staff)    → SOLO i progetti dove sono in project_members
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. TABELLA project_members
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.project_members (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id)  on delete cascade,
  user_id      uuid not null references public.profiles(id)  on delete cascade,
  role         text not null default 'viewer' check (role in ('viewer', 'editor')),
  invited_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (project_id, user_id)
);

-- indici
create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists project_members_user_id_idx    on public.project_members(user_id);

-- RLS
alter table public.project_members enable row level security;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. HELPER is_project_member
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.is_project_member(proj_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members
    where project_id = proj_id and user_id = auth.uid()
  );
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. POLICY su project_members
-- ────────────────────────────────────────────────────────────────────────────

-- SELECT: superadmin vede tutto, altri vedono solo le righe che li riguardano
-- (o tutte le righe del workspace se sono admin)
drop policy if exists "project_members: select" on public.project_members;
create policy "project_members: select"
  on public.project_members for select
  using (
    public.is_superadmin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and public.is_workspace_admin(p.workspace_id)
    )
  );

-- INSERT: superadmin o workspace admin possono aggiungere membri a un progetto
drop policy if exists "project_members: insert" on public.project_members;
create policy "project_members: insert"
  on public.project_members for insert
  with check (
    public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and public.is_workspace_admin(p.workspace_id)
    )
  );

-- UPDATE: stessa logica
drop policy if exists "project_members: update" on public.project_members;
create policy "project_members: update"
  on public.project_members for update
  using (
    public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and public.is_workspace_admin(p.workspace_id)
    )
  );

-- DELETE: stessa logica
drop policy if exists "project_members: delete" on public.project_members;
create policy "project_members: delete"
  on public.project_members for delete
  using (
    public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and public.is_workspace_admin(p.workspace_id)
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 4. AGGIORNA policy SELECT su projects
--    Prima: tutti i workspace_members vedono tutti i progetti
--    Dopo:  workspace admin → tutti, staff → solo quelli in project_members
-- ────────────────────────────────────────────────────────────────────────────
drop policy if exists "projects: select members and superadmin" on public.projects;
create policy "projects: select members and superadmin"
  on public.projects for select
  using (
    -- superadmin vede tutto
    public.is_superadmin()
    -- il workspace admin vede tutti i progetti del suo workspace
    or public.is_workspace_admin(workspace_id)
    -- gli altri vedono solo i progetti dove sono stati aggiunti
    or public.is_project_member(id)
  );

-- Aggiorna anche le altre policy sui progetti per coerenza
-- (insert/update/delete restano limitate agli admin, non cambia nulla)

-- ────────────────────────────────────────────────────────────────────────────
-- 5. A CASCATA: project_pages e project_leads
--    Aggiorna la policy SELECT per riflettere la nuova logica
-- ────────────────────────────────────────────────────────────────────────────

-- pages: un utente vede le pagine del progetto se può vedere il progetto
drop policy if exists "pages: public read published" on public.project_pages;
create policy "pages: public read published"
  on public.project_pages for select
  to anon, authenticated
  using (
    published = true
    or public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_pages.project_id
        and (
          public.is_workspace_admin(p.workspace_id)
          or public.is_project_member(p.id)
        )
    )
  );

-- leads: stessa logica
drop policy if exists "leads: read members and superadmin" on public.project_leads;
create policy "leads: read members and superadmin"
  on public.project_leads for select
  using (
    public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_leads.project_id
        and (
          public.is_workspace_admin(p.workspace_id)
          or public.is_project_member(p.id)
        )
    )
  );
