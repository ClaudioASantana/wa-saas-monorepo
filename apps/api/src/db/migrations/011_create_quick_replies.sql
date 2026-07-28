-- Migration: 011_create_quick_replies
-- Description: Cria tabela de respostas rápidas por tenant
-- Rollback: DROP TABLE IF EXISTS quick_replies CASCADE;

CREATE TABLE IF NOT EXISTS quick_replies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shortcut    TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, shortcut)
);

CREATE INDEX IF NOT EXISTS idx_quick_replies_tenant ON quick_replies(tenant_id);

CREATE OR REPLACE TRIGGER quick_replies_updated_at
  BEFORE UPDATE ON quick_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
