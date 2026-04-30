ALTER TABLE public.reminder_flows 
ALTER COLUMN action_token SET DEFAULT replace(replace(encode(extensions.gen_random_bytes(8), 'base64'), '/', '_'), '+', '-');