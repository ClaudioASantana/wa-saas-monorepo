ALTER TABLE public.channels RENAME COLUMN zapi_instance_id TO provider_instance_id;
ALTER TABLE public.channels RENAME COLUMN zapi_token TO provider_token;
