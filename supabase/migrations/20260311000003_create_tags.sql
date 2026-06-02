-- Migration: Create tags and conversation_tags tables
-- Description: Allows labeling conversations for organization and filtering
-- Created: 2026-03-11

-- 1. Create tags table (definitions)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6', -- Default blue-500
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

-- Index for workspace-level queries
CREATE INDEX IF NOT EXISTS idx_tags_workspace_id ON public.tags(workspace_id);

-- 2. Create conversation_tags table (N-N relationship)
CREATE TABLE IF NOT EXISTS public.conversation_tags (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, tag_id)
);

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag_id ON public.conversation_tags(tag_id);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tags/links for their workspaces
CREATE POLICY "Users can view tags for their workspaces" ON public.tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_workspaces
      WHERE user_workspaces.workspace_id = tags.workspace_id
      AND user_workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view conversation tags for their workspaces" ON public.conversation_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.user_workspaces ON user_workspaces.workspace_id = conversations.workspace_id
      WHERE conversations.id = conversation_tags.conversation_id
      AND user_workspaces.user_id = auth.uid()
    )
  );

-- Policy: Admins can manage tags
CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_workspaces
      WHERE user_workspaces.workspace_id = tags.workspace_id
      AND user_workspaces.user_id = auth.uid()
      AND user_workspaces.role IN ('owner', 'admin')
    )
  );

-- Policy: All agents can link/unlink tags in their workspace
CREATE POLICY "Agents can manage conversation tags" ON public.conversation_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.user_workspaces ON user_workspaces.workspace_id = conversations.workspace_id
      WHERE conversations.id = conversation_tags.conversation_id
      AND user_workspaces.user_id = auth.uid()
    )
  );
