-- ============================================================================
-- TheraFlow — Permettere signup pubblico
-- ============================================================================
-- Esegui dopo 02_policies.sql.
--
-- Cambia: prima solo super admin poteva creare workspace. Ora chiunque
-- autenticato può crearne UNO dove sé stesso è l'owner. È quello che
-- serve per il flow di signup pubblico.
-- ============================================================================

-- Sostituisce la policy "workspaces: insert"
drop policy if exists "workspaces: insert superadmin" on public.workspaces;
drop policy if exists "workspaces: insert authenticated as owner" on public.workspaces;

create policy "workspaces: insert authenticated as owner"
  on public.workspaces for insert
  to authenticated
  with check (
    -- Super admin può creare per chiunque
    public.is_superadmin()
    -- Utente normale può creare solo dove SÉ STESSO è owner
    or owner_id = auth.uid()
  );

-- Vincolo extra: un utente non super admin può possedere al massimo 1 workspace
-- (Lo controlliamo via trigger perché RLS non può contare righe in modo elegante)
create or replace function public.enforce_one_workspace_per_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then
    if exists (
      select 1 from public.workspaces
      where owner_id = new.owner_id and id != new.id
    ) then
      raise exception 'Hai già un workspace. Per crearne altri contatta TheraFlow.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_one_workspace on public.workspaces;
create trigger trg_enforce_one_workspace
  before insert on public.workspaces
  for each row execute function public.enforce_one_workspace_per_user();
