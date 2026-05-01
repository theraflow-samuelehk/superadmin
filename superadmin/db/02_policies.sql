-- ============================================================================
-- TheraFlow — Row Level Security policies
-- ============================================================================
-- Esegui DOPO 01_schema.sql.
-- Definisce chi può leggere/scrivere cosa.
--
-- Regole base:
--   - Super admin (global_role='superadmin')          → vede e modifica TUTTO
--   - Admin di workspace (membership.role='admin')    → vede e modifica solo il SUO workspace
--   - Staff di workspace (membership.role='staff')    → vede tutto del workspace,
--                                                       modifica solo i progetti dove l'admin lo abilita
--   - Pubblico (anon)                                 → solo lettura di pagine pubblicate
-- ============================================================================

-- ============================================================================
-- HELPERS — funzioni utility per le policy
-- ============================================================================

-- True se l'utente loggato è super admin
create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and global_role = 'superadmin'
  );
$$;

-- True se l'utente loggato è membro del workspace passato
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  ) or exists (
    select 1 from public.workspaces
    where id = ws_id and owner_id = auth.uid()
  );
$$;

-- True se l'utente loggato è admin del workspace (owner o membership admin)
create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspaces
    where id = ws_id and owner_id = auth.uid()
  ) or exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- ABILITA RLS SU TUTTE LE TABELLE
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.workspaces          enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.projects            enable row level security;
alter table public.project_pages       enable row level security;
alter table public.project_leads       enable row level security;
alter table public.activity            enable row level security;
alter table public.invites             enable row level security;

-- ============================================================================
-- PROFILES
-- ============================================================================
drop policy if exists "profiles: read own and superadmin all" on public.profiles;
create policy "profiles: read own and superadmin all"
  on public.profiles for select
  using (id = auth.uid() or public.is_superadmin());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid() or public.is_superadmin())
  with check (id = auth.uid() or public.is_superadmin());

-- ============================================================================
-- WORKSPACES
-- ============================================================================
drop policy if exists "workspaces: select members and superadmin" on public.workspaces;
create policy "workspaces: select members and superadmin"
  on public.workspaces for select
  using (
    public.is_superadmin()
    or owner_id = auth.uid()
    or exists (
      select 1 from public.workspace_members
      where workspace_id = workspaces.id and user_id = auth.uid()
    )
  );

drop policy if exists "workspaces: insert superadmin" on public.workspaces;
create policy "workspaces: insert superadmin"
  on public.workspaces for insert
  with check (public.is_superadmin());

drop policy if exists "workspaces: update admin and superadmin" on public.workspaces;
create policy "workspaces: update admin and superadmin"
  on public.workspaces for update
  using (public.is_superadmin() or owner_id = auth.uid())
  with check (public.is_superadmin() or owner_id = auth.uid());

drop policy if exists "workspaces: delete superadmin" on public.workspaces;
create policy "workspaces: delete superadmin"
  on public.workspaces for delete
  using (public.is_superadmin());

-- ============================================================================
-- WORKSPACE_MEMBERS
-- ============================================================================
drop policy if exists "members: select members and superadmin" on public.workspace_members;
create policy "members: select members and superadmin"
  on public.workspace_members for select
  using (
    public.is_superadmin()
    or public.is_workspace_member(workspace_id)
  );

drop policy if exists "members: insert admin and superadmin" on public.workspace_members;
create policy "members: insert admin and superadmin"
  on public.workspace_members for insert
  with check (public.is_superadmin() or public.is_workspace_admin(workspace_id));

drop policy if exists "members: update admin and superadmin" on public.workspace_members;
create policy "members: update admin and superadmin"
  on public.workspace_members for update
  using (public.is_superadmin() or public.is_workspace_admin(workspace_id));

drop policy if exists "members: delete admin and superadmin" on public.workspace_members;
create policy "members: delete admin and superadmin"
  on public.workspace_members for delete
  using (public.is_superadmin() or public.is_workspace_admin(workspace_id));

-- ============================================================================
-- PROJECTS
-- ============================================================================
drop policy if exists "projects: select members and superadmin" on public.projects;
create policy "projects: select members and superadmin"
  on public.projects for select
  using (
    public.is_superadmin()
    or public.is_workspace_member(workspace_id)
  );

drop policy if exists "projects: insert admin and superadmin" on public.projects;
create policy "projects: insert admin and superadmin"
  on public.projects for insert
  with check (public.is_superadmin() or public.is_workspace_admin(workspace_id));

drop policy if exists "projects: update admin and superadmin" on public.projects;
create policy "projects: update admin and superadmin"
  on public.projects for update
  using (public.is_superadmin() or public.is_workspace_admin(workspace_id))
  with check (public.is_superadmin() or public.is_workspace_admin(workspace_id));

drop policy if exists "projects: delete admin and superadmin" on public.projects;
create policy "projects: delete admin and superadmin"
  on public.projects for delete
  using (public.is_superadmin() or public.is_workspace_admin(workspace_id));

-- ============================================================================
-- PROJECT_PAGES
-- ============================================================================
-- Le pagine pubblicate sono pubbliche (chiunque può leggere), il resto solo membri.
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
        and public.is_workspace_member(p.workspace_id)
    )
  );

drop policy if exists "pages: write workspace admin" on public.project_pages;
create policy "pages: write workspace admin"
  on public.project_pages for all
  using (
    public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_pages.project_id
        and public.is_workspace_admin(p.workspace_id)
    )
  )
  with check (
    public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_pages.project_id
        and public.is_workspace_admin(p.workspace_id)
    )
  );

-- ============================================================================
-- PROJECT_LEADS — i form dei siti scrivono qui, l'admin del workspace legge
-- ============================================================================
drop policy if exists "leads: anon insert (form submission)" on public.project_leads;
create policy "leads: anon insert (form submission)"
  on public.project_leads for insert
  to anon, authenticated
  with check (true);  -- chiunque può inviare un lead (i siti pubblici)

drop policy if exists "leads: read members and superadmin" on public.project_leads;
create policy "leads: read members and superadmin"
  on public.project_leads for select
  using (
    public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_leads.project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

drop policy if exists "leads: update admin and superadmin" on public.project_leads;
create policy "leads: update admin and superadmin"
  on public.project_leads for update
  using (
    public.is_superadmin()
    or exists (
      select 1 from public.projects p
      where p.id = project_leads.project_id
        and public.is_workspace_admin(p.workspace_id)
    )
  );

-- ============================================================================
-- ACTIVITY — log read-only per i membri del workspace
-- ============================================================================
drop policy if exists "activity: read members and superadmin" on public.activity;
create policy "activity: read members and superadmin"
  on public.activity for select
  using (
    public.is_superadmin()
    or workspace_id is null
    or public.is_workspace_member(workspace_id)
  );

-- Solo il sistema (superadmin o trigger) inserisce activity
drop policy if exists "activity: insert superadmin and members" on public.activity;
create policy "activity: insert superadmin and members"
  on public.activity for insert
  with check (
    public.is_superadmin()
    or workspace_id is null
    or public.is_workspace_member(workspace_id)
  );

-- ============================================================================
-- INVITES
-- ============================================================================
drop policy if exists "invites: read admin and superadmin" on public.invites;
create policy "invites: read admin and superadmin"
  on public.invites for select
  using (
    public.is_superadmin()
    or public.is_workspace_admin(workspace_id)
  );

drop policy if exists "invites: insert admin and superadmin" on public.invites;
create policy "invites: insert admin and superadmin"
  on public.invites for insert
  with check (
    public.is_superadmin()
    or public.is_workspace_admin(workspace_id)
  );

drop policy if exists "invites: delete admin and superadmin" on public.invites;
create policy "invites: delete admin and superadmin"
  on public.invites for delete
  using (
    public.is_superadmin()
    or public.is_workspace_admin(workspace_id)
  );
