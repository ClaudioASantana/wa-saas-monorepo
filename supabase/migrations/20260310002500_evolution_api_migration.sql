DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'channels'
      AND column_name = 'zapi_instance_id'
  ) THEN
    ALTER TABLE public.channels RENAME COLUMN zapi_instance_id TO provider_instance_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'channels'
      AND column_name = 'zapi_token'
  ) THEN
    ALTER TABLE public.channels RENAME COLUMN zapi_token TO provider_token;
  END IF;
END $$;
