-- ============================================================================
-- TheraFlow — Seed progetti reali di Samuele
-- Esegui nel SQL Editor di Supabase
-- ============================================================================

do $$
declare
  wid uuid;
begin
  -- Recupera il workspace di samuelehk@gmail.com
  select w.id into wid
  from public.workspaces w
  join public.profiles p on p.id = w.owner_id
  where p.email = 'samuelehk@gmail.com'
  limit 1;

  if wid is null then
    raise exception 'Workspace di samuelehk@gmail.com non trovato';
  end if;

  -- ── Funnel ──────────────────────────────────────────────────────────────
  insert into public.projects (workspace_id, name, slug, category, status, subdomain, tech_stack)
  values
    (wid, 'Funnel Lash',        'funnel-lash',        'Funnel',       'live', 'funnel-lash',        array['PHP']),
    (wid, 'Funnel Nails',       'funnel-nails',       'Funnel',       'live', 'funnel-nails',       array['PHP']),
    (wid, 'Funnel Segretarie',  'funnel-segretarie',  'Funnel',       'live', 'funnel-segretarie',  array['PHP'])
  on conflict (subdomain) do nothing;

  -- ── Landing Page ────────────────────────────────────────────────────────
  insert into public.projects (workspace_id, name, slug, category, status, subdomain, tech_stack)
  values
    (wid, 'AromaFit Landing',   'aromafit-landing',   'Landing Page', 'live', 'aromafit-landing',   array['React', 'Vite']),
    (wid, 'Fresh IQ',           'fresh-iq',           'Landing Page', 'live', 'fresh-iq',           array['React', 'Vite']),
    (wid, 'Glow Up',            'glow-up',            'Landing Page', 'live', 'glow-up',            array['React', 'Vite']),
    (wid, 'ReviewShield Broad', 'reviewshield-broad', 'Landing Page', 'live', 'reviewshield-broad', array['PHP'])
  on conflict (subdomain) do nothing;

  -- ── SaaS / Tool ─────────────────────────────────────────────────────────
  insert into public.projects (workspace_id, name, slug, category, status, subdomain, tech_stack)
  values
    (wid, 'ReviewBooster',          'reviewbooster',          'SaaS',     'live',  'reviewbooster',          array['PHP', 'MySQL']),
    (wid, 'ReviewShield',           'reviewshield',           'SaaS',     'live',  'reviewshield',           array['HTML', 'CSS', 'JS']),
    (wid, 'GlowUp WhatsApp',        'glowup-whatsapp',        'SaaS',     'live',  'glowup-whatsapp',        array['React', 'Vite'])
  on conflict (subdomain) do nothing;

  -- ── Pannello interno ────────────────────────────────────────────────────
  insert into public.projects (workspace_id, name, slug, category, status, subdomain, tech_stack)
  values
    (wid, 'Pannello Progetti', 'pannello-progetti', 'Generico', 'draft', 'pannello-progetti', array['PHP'])
  on conflict (subdomain) do nothing;

  raise notice 'Progetti inseriti nel workspace %', wid;
end;
$$;
