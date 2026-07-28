-- Migration: 009_create_media_files
-- Description: Tabelas para controle de mídia (imagens, áudios, etc) enviadas pelo WhatsApp
-- Rollback: DROP TABLE IF EXISTS media_files CASCADE;

CREATE TABLE IF NOT EXISTS media_files (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id      UUID        REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Detalhes do arquivo original
  original_name   TEXT,
  mime_type       TEXT        NOT NULL,
  size_bytes      INTEGER     NOT NULL,
  
  -- Info do WA Baileys
  wa_message_id   TEXT        NOT NULL,
  wa_media_key    TEXT,
  wa_url          TEXT,
  wa_direct_path  TEXT,
  
  -- Status do processamento
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'uploaded', 'failed')),
  attempts        INTEGER     NOT NULL DEFAULT 0,
  error           TEXT,
  
  -- Destino final
  storage_url     TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_media_files_tenant ON media_files(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_status ON media_files(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_media_files_wa_id  ON media_files(wa_message_id);

CREATE OR REPLACE TRIGGER media_files_updated_at
  BEFORE UPDATE ON media_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
