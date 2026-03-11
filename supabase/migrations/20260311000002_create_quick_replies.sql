-- Migration: Create quick_replies table
-- Description: Stores canned responses for agents to use with shortcuts like /
-- Created: 2026-03-11

CREATE TABLE IF NOT EXISTS public.quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, shortcut)
);

-- Index for searching quick replies within a workspace
CREATE INDEX IF NOT EXISTS idx_quick_replies_workspace_id ON public.quick_replies(workspace_id);

-- Enable RLS
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view quick replies for workspaces they belong to
CREATE POLICY "Users can view quick replies for their workspaces" ON public.quick_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_workspaces
      WHERE user_workspaces.workspace_id = quick_replies.workspace_id
      AND user_workspaces.user_id = auth.uid()
    )
  );

-- Policy: Admins/Owners can manage quick replies
CREATE POLICY "Admins can manage quick replies" ON public.quick_replies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_workspaces
      WHERE user_workspaces.workspace_id = quick_replies.workspace_id
      AND user_workspaces.user_id = auth.uid()
      AND user_workspaces.role IN ('owner', 'admin')
    )
  );
