
-- Restore profile (un-soft-delete)
UPDATE public.profiles 
SET deleted_at = NULL 
WHERE user_id = '7d458727-a87b-491b-b137-ed809d4336d6';

-- Restore products: move back from f8da3885 to 7d458727
UPDATE public.products 
SET user_id = '7d458727-a87b-491b-b137-ed809d4336d6'
WHERE id IN (
  SELECT DISTINCT record_id::uuid FROM public.audit_logs 
  WHERE table_name = 'products' 
    AND created_at >= '2026-03-26 17:00:00' 
    AND (old_data->>'user_id') = '7d458727-a87b-491b-b137-ed809d4336d6' 
    AND (new_data->>'user_id') = 'f8da3885-b0ee-4b6b-acd8-92886e589aa7'
);

-- Restore services
UPDATE public.services 
SET user_id = '7d458727-a87b-491b-b137-ed809d4336d6'
WHERE id IN (
  SELECT DISTINCT record_id::uuid FROM public.audit_logs 
  WHERE table_name = 'services' 
    AND created_at >= '2026-03-26 17:00:00' 
    AND (old_data->>'user_id') = '7d458727-a87b-491b-b137-ed809d4336d6' 
    AND (new_data->>'user_id') = 'f8da3885-b0ee-4b6b-acd8-92886e589aa7'
);

-- Restore clients
UPDATE public.clients 
SET user_id = '7d458727-a87b-491b-b137-ed809d4336d6'
WHERE id IN (
  SELECT DISTINCT record_id::uuid FROM public.audit_logs 
  WHERE table_name = 'clients' 
    AND created_at >= '2026-03-26 17:00:00' 
    AND (old_data->>'user_id') = '7d458727-a87b-491b-b137-ed809d4336d6' 
    AND (new_data->>'user_id') = 'f8da3885-b0ee-4b6b-acd8-92886e589aa7'
);

-- Restore operators (user_id + un-soft-delete)
UPDATE public.operators 
SET user_id = '7d458727-a87b-491b-b137-ed809d4336d6',
    deleted_at = NULL
WHERE id IN (
  SELECT DISTINCT record_id::uuid FROM public.audit_logs 
  WHERE table_name = 'operators' 
    AND created_at >= '2026-03-26 17:00:00' 
    AND (old_data->>'user_id') = '7d458727-a87b-491b-b137-ed809d4336d6'
);

-- Restore appointments (user_id + un-soft-delete where applicable)
UPDATE public.appointments 
SET user_id = '7d458727-a87b-491b-b137-ed809d4336d6'
WHERE id IN (
  SELECT DISTINCT record_id::uuid FROM public.audit_logs 
  WHERE table_name = 'appointments' 
    AND created_at >= '2026-03-26 17:00:00' 
    AND (old_data->>'user_id') = '7d458727-a87b-491b-b137-ed809d4336d6' 
    AND (new_data->>'user_id') = 'f8da3885-b0ee-4b6b-acd8-92886e589aa7'
);

-- Un-soft-delete appointments that were soft-deleted during the move
UPDATE public.appointments 
SET deleted_at = NULL
WHERE id IN (
  SELECT DISTINCT record_id::uuid FROM public.audit_logs 
  WHERE table_name = 'appointments' 
    AND action = 'SOFT_DELETE'
    AND created_at >= '2026-03-26 17:00:00' 
    AND (old_data->>'user_id') = '7d458727-a87b-491b-b137-ed809d4336d6'
) AND user_id = '7d458727-a87b-491b-b137-ed809d4336d6';

-- Restore transactions
UPDATE public.transactions 
SET user_id = '7d458727-a87b-491b-b137-ed809d4336d6'
WHERE id IN (
  SELECT DISTINCT record_id::uuid FROM public.audit_logs 
  WHERE table_name = 'transactions' 
    AND created_at >= '2026-03-26 17:00:00' 
    AND (old_data->>'user_id') = '7d458727-a87b-491b-b137-ed809d4336d6' 
    AND (new_data->>'user_id') = 'f8da3885-b0ee-4b6b-acd8-92886e589aa7'
);

-- Restore client_packages
UPDATE public.client_packages 
SET user_id = '7d458727-a87b-491b-b137-ed809d4336d6'
WHERE id IN (
  SELECT DISTINCT record_id::uuid FROM public.audit_logs 
  WHERE table_name = 'client_packages' 
    AND created_at >= '2026-03-26 17:00:00' 
    AND (old_data->>'user_id') = '7d458727-a87b-491b-b137-ed809d4336d6' 
    AND (new_data->>'user_id') = 'f8da3885-b0ee-4b6b-acd8-92886e589aa7'
);
