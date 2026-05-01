-- ============================================================================
-- TheraFlow — Seed dati di prova
-- ============================================================================
-- Esegui DOPO 01_schema.sql e 02_policies.sql.
--
-- IMPORTANTE: prima di eseguire questo seed, devi creare gli utenti in
-- Supabase Auth (dashboard → Authentication → Users → "Add user").
-- Crea questi 6 utenti:
--   1. samuelehk@gmail.com         (super admin)
--   2. thomas@theraflow.io          (super admin)
--   3. giulia@studiomarchetti.it    (admin Marchetti)
--   4. luca@nordico.studio          (admin Nordico)
--   5. fede@studiomarchetti.it      (staff Marchetti)
--   6. dani@nordico.studio          (staff Nordico)
--
-- Dopo creati, esegui questo SQL.
-- I trigger handle_new_user() avranno già creato i record in `profiles`.
-- Qui aggiorniamo i ruoli e creiamo workspace/progetti.
-- ============================================================================

-- ============================================================================
-- 1. Aggiorna i profili con nomi e ruoli corretti
-- ============================================================================
update public.profiles set
  name = 'Samuele Cancemi',
  avatar_color = 'cyan',
  global_role = 'superadmin'
where email = 'samuelehk@gmail.com';

update public.profiles set
  name = 'Thomas Camilli',
  avatar_color = 'violet',
  global_role = 'superadmin'
where email = 'thomas@theraflow.io';

update public.profiles set
  name = 'Giulia Marchetti',
  avatar_color = 'pink'
where email = 'giulia@studiomarchetti.it';

update public.profiles set
  name = 'Luca Nordico',
  avatar_color = 'emerald'
where email = 'luca@nordico.studio';

update public.profiles set
  name = 'Federica Bianchi',
  avatar_color = 'amber'
where email = 'fede@studiomarchetti.it';

update public.profiles set
  name = 'Daniele Rossi',
  avatar_color = 'sky'
where email = 'dani@nordico.studio';

-- ============================================================================
-- 2. Workspaces
-- ============================================================================
insert into public.workspaces (name, slug, owner_id, status, plan, badge, monthly_revenue, storage_mb, storage_limit_mb)
select
  'Cancemi × Camilli',
  'studio',
  p.id,
  'active',
  'enterprise',
  'INTERNAL',
  12450,
  3200,
  10240
from public.profiles p where p.email = 'samuelehk@gmail.com'
on conflict (slug) do nothing;

insert into public.workspaces (name, slug, owner_id, status, plan, monthly_revenue, storage_mb, storage_limit_mb)
select
  'Studio Marchetti Beauty',
  'marchetti',
  p.id,
  'active',
  'growth',
  4280,
  1840,
  5120
from public.profiles p where p.email = 'giulia@studiomarchetti.it'
on conflict (slug) do nothing;

insert into public.workspaces (name, slug, owner_id, status, plan, monthly_revenue, storage_mb, storage_limit_mb)
select
  'Nordico Studio',
  'nordico',
  p.id,
  'active',
  'scale',
  8910,
  2560,
  8192
from public.profiles p where p.email = 'luca@nordico.studio'
on conflict (slug) do nothing;

-- ============================================================================
-- 3. Workspace members (oltre all'owner)
-- ============================================================================
-- Federica → staff su Marchetti
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, p.id, 'staff'
from public.workspaces w, public.profiles p
where w.slug = 'marchetti' and p.email = 'fede@studiomarchetti.it'
on conflict (workspace_id, user_id) do nothing;

-- Daniele → staff su Nordico
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, p.id, 'staff'
from public.workspaces w, public.profiles p
where w.slug = 'nordico' and p.email = 'dani@nordico.studio'
on conflict (workspace_id, user_id) do nothing;

-- ============================================================================
-- 4. Projects
-- ============================================================================
-- ws_studio (5 progetti)
insert into public.projects (workspace_id, name, slug, category, status, subdomain, custom_domain, visits_30d, leads_30d, revenue_30d, tech_stack, last_deploy_at)
select w.id, x.name, x.slug, x.category, x.status, x.subdomain, x.custom_domain, x.visits, x.leads, x.revenue, x.tech, x.last_deploy
from public.workspaces w,
  (values
    ('ReviewBooster',    'reviewbooster',   'SaaS',                 'live',    'reviewbooster',   'reviewbooster.com', 12340, 89,  2840, array['PHP','MySQL'],  now() - interval '2 days'),
    ('ReviewShield',     'reviewshield',    'SaaS',                 'live',    'reviewshield',    null,                 8120, 54,  1920, array['React','Vite'], now() - interval '5 days'),
    ('Glow-Up',          'glow-up',         'SaaS',                 'live',    'glow-up',         null,                 3210, 38,  1480, array['React','Vite'], now() - interval '1 day'),
    ('Aromafit Landing', 'aromafit',        'Funnel & Landing',     'live',    'aromafit',        'aromafit.it',       28940, 412, 6210, array['React','Vite'], now() - interval '3 days'),
    ('Fresh-IQ',         'fresh-iq',        'Marketplace',          'draft',   'fresh-iq',        null,                  120,  4,    0, array['Next.js'],      null)
  ) as x(name, slug, category, status, subdomain, custom_domain, visits, leads, revenue, tech, last_deploy)
where w.slug = 'studio'
on conflict (workspace_id, slug) do nothing;

-- ws_marchetti (3 progetti)
insert into public.projects (workspace_id, name, slug, category, status, subdomain, custom_domain, visits_30d, leads_30d, revenue_30d, tech_stack, last_deploy_at)
select w.id, x.name, x.slug, x.category, x.status, x.subdomain, x.custom_domain, x.visits, x.leads, x.revenue, x.tech, x.last_deploy
from public.workspaces w,
  (values
    ('Funnel Lash Academy',  'funnel-lash',       'Corsi', 'live', 'lash',       'lashacademy.it', 18420, 287, 8210, array['PHP'], now() - interval '12 hours'),
    ('Funnel Corso Unghie',  'funnel-nails',      'Corsi', 'live', 'nails',       null,             9840, 124, 3920, array['PHP'], now() - interval '2 days'),
    ('Funnel Segretarie',    'funnel-segretarie', 'Corsi', 'live', 'segretarie',  null,             6210,  78, 2150, array['PHP'], now() - interval '4 days')
  ) as x(name, slug, category, status, subdomain, custom_domain, visits, leads, revenue, tech, last_deploy)
where w.slug = 'marchetti'
on conflict (workspace_id, slug) do nothing;

-- ws_nordico (2 progetti)
insert into public.projects (workspace_id, name, slug, category, status, subdomain, custom_domain, visits_30d, leads_30d, revenue_30d, tech_stack, last_deploy_at)
select w.id, x.name, x.slug, x.category, x.status, x.subdomain, x.custom_domain, x.visits, x.leads, x.revenue, x.tech, x.last_deploy
from public.workspaces w,
  (values
    ('Nordico Shop',     'shop',     'eCommerce',         'live', 'shop',     'nordico.shop', 24820,   0, 18420, array['Shopify'], now() - interval '18 hours'),
    ('Nordico Magazine', 'magazine', 'Blog & Contenuti',  'live', 'magazine', null,            8420,  12,     0, array['Next.js'], now() - interval '7 days')
  ) as x(name, slug, category, status, subdomain, custom_domain, visits, leads, revenue, tech, last_deploy)
where w.slug = 'nordico'
on conflict (workspace_id, slug) do nothing;

-- ============================================================================
-- 5. Activity di esempio (ultimi 7 giorni)
-- ============================================================================
-- Login recenti
insert into public.activity (workspace_id, actor_id, type, message, created_at)
select w.id, p.id, 'login', p.name || ' ha effettuato l''accesso', now() - interval '2 hours'
from public.workspaces w, public.profiles p
where w.slug = 'studio' and p.email = 'samuelehk@gmail.com';

-- Deploy
insert into public.activity (workspace_id, project_id, actor_id, type, message, created_at)
select w.id, pr.id, p.id, 'deploy', 'Deploy Aromafit Landing completato', now() - interval '3 hours'
from public.workspaces w, public.projects pr, public.profiles p
where w.slug = 'studio' and pr.slug = 'aromafit' and pr.workspace_id = w.id and p.email = 'samuelehk@gmail.com';

-- Lead
insert into public.activity (workspace_id, project_id, type, message, created_at)
select w.id, pr.id, 'create', '47 nuovi lead su Funnel Lash Academy', now() - interval '6 hours'
from public.workspaces w, public.projects pr
where w.slug = 'marchetti' and pr.slug = 'funnel-lash' and pr.workspace_id = w.id;

-- Domain
insert into public.activity (workspace_id, type, message, created_at)
select w.id, 'domain', 'Dominio nordico.shop verificato', now() - interval '1 day'
from public.workspaces w where w.slug = 'nordico';

-- Billing
insert into public.activity (workspace_id, type, message, created_at)
select w.id, 'billing', 'Pagamento mensile elaborato (€4.280)', now() - interval '2 days'
from public.workspaces w where w.slug = 'marchetti';

-- ============================================================================
-- 6. Inviti pendenti
-- ============================================================================
insert into public.invites (workspace_id, email, role, invited_by)
select w.id, 'elena@studiomarchetti.it', 'staff', p.id
from public.workspaces w, public.profiles p
where w.slug = 'marchetti' and p.email = 'giulia@studiomarchetti.it';

insert into public.invites (workspace_id, email, role, invited_by)
select w.id, 'marco@nordico.studio', 'staff', p.id
from public.workspaces w, public.profiles p
where w.slug = 'nordico' and p.email = 'luca@nordico.studio';
