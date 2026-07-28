-- Migration: 003_create_crm_tables
-- Description: Tabelas do CRM Kanban (Funnels, Stages, Cards)
-- Rollback: DROP TABLE IF EXISTS crm_cards, crm_stages, crm_funnels CASCADE;

CREATE TABLE IF NOT EXISTS crm_funnels (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_funnels_tenant ON crm_funnels(tenant_id);

CREATE OR REPLACE TRIGGER crm_funnels_updated_at
  BEFORE UPDATE ON crm_funnels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS crm_stages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  funnel_id   UUID        NOT NULL REFERENCES crm_funnels(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT 'gray',
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_stages_tenant_funnel ON crm_stages(tenant_id, funnel_id);

CREATE OR REPLACE TRIGGER crm_stages_updated_at
  BEFORE UPDATE ON crm_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS crm_cards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stage_id        UUID        NOT NULL REFERENCES crm_stages(id) ON DELETE CASCADE,
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  position        INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_cards_tenant_stage ON crm_cards(tenant_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_cards_tenant_conversation ON crm_cards(tenant_id, conversation_id);

CREATE OR REPLACE TRIGGER crm_cards_updated_at
  BEFORE UPDATE ON crm_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
