ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_category text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS account_type text DEFAULT NULL;