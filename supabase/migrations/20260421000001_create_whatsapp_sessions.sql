CREATE TABLE public.whatsapp_sessions (
  instance_id text NOT NULL,
  key_id text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT whatsapp_sessions_pkey PRIMARY KEY (instance_id, key_id)
);

-- Enable RLS (Row Level Security) - Only internal microservices will read/write
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Temporarily allow all operations for anon/authenticated (in production you might restrict to Service Role)
CREATE POLICY "Allow Service Role fully on whatsapp_sessions" ON public.whatsapp_sessions
  USING (true)
  WITH CHECK (true);
