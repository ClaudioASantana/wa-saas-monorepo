ALTER TABLE public.channels RENAME COLUMN instance_id TO provider_instance_id;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS provider_token text;
