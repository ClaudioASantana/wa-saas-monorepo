-- Migration: Create media_files table
-- Story 0.5: S3/Supabase Async Media Upload Pipeline

CREATE TABLE IF NOT EXISTS public.media_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL, -- Will be filled from conversation/workspace
  message_id  TEXT NOT NULL,  -- Evolution/WA Message ID
  media_id    TEXT NOT NULL,  -- Evolution/Meta Media ID
  mime_type   TEXT NOT NULL,
  storage_url TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'uploaded', 'failed')),
  attempts    INT NOT NULL DEFAULT 0,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup during processing
CREATE INDEX IF NOT EXISTS idx_media_files_status ON media_files(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_media_files_wa_id ON media_files(message_id);

-- Simple RLS (for now, same as messages)
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.media_files FOR SELECT USING (true);
