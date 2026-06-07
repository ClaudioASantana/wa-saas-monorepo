CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, name, language)
);

-- RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates of their workspaces" 
  ON message_templates FOR SELECT 
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert templates to their workspaces" 
  ON message_templates FOR INSERT 
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates of their workspaces" 
  ON message_templates FOR UPDATE 
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates of their workspaces" 
  ON message_templates FOR DELETE 
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );
