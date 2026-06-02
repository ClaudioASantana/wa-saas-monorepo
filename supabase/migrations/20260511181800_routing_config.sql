CREATE TABLE IF NOT EXISTS public.routing_config (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id),
  round_robin_enabled boolean DEFAULT false,
  retention_days integer DEFAULT 7,
  tag_routing jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.routing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view routing config for their workspace"
  ON public.routing_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_workspaces
      WHERE user_workspaces.workspace_id = routing_config.workspace_id
      AND user_workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update routing config"
  ON public.routing_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_workspaces
      WHERE user_workspaces.workspace_id = routing_config.workspace_id
      AND user_workspaces.user_id = auth.uid()
      AND user_workspaces.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can insert routing config"
  ON public.routing_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_workspaces
      WHERE user_workspaces.workspace_id = routing_config.workspace_id
      AND user_workspaces.user_id = auth.uid()
      AND user_workspaces.role IN ('owner', 'admin')
    )
  );

ALTER TABLE public.user_workspaces ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
