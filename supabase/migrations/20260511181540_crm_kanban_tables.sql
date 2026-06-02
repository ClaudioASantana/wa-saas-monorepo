CREATE TABLE IF NOT EXISTS public.crm_funnels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id uuid REFERENCES public.crm_funnels(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL,
  color text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id uuid REFERENCES public.crm_stages(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
