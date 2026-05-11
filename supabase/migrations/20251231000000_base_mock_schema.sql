CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text
);

CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  name text
);

CREATE TABLE IF NOT EXISTS public.user_workspaces (
  user_id uuid,
  workspace_id uuid REFERENCES public.workspaces(id),
  role text,
  PRIMARY KEY (user_id, workspace_id)
);

CREATE TABLE IF NOT EXISTS public.channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id),
  name text,
  instance_id text,
  status text,
  provider text,
  connection_status text
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id),
  tenant_id uuid REFERENCES public.tenants(id),
  phone text,
  name text,
  remote_jid text
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id),
  tenant_id uuid REFERENCES public.tenants(id),
  channel_id uuid REFERENCES public.channels(id),
  contact_id uuid REFERENCES public.contacts(id),
  last_message_preview text
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  conversation_id uuid REFERENCES public.conversations(id),
  wa_message_id text,
  direction text,
  type text,
  content text,
  sender_name text
);
