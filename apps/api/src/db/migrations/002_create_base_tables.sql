-- Migration: 002_create_base_tables
-- Description: Tabelas base do CRM com tenant_id (sharding-ready)
-- Rollback: DROP TABLE IF EXISTS messages, conversations, contacts, agents CASCADE;

-- Contacts (clientes do WhatsApp)
CREATE TABLE IF NOT EXISTS contacts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone       TEXT        NOT NULL,
  name        TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant       ON contacts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_phone ON contacts(tenant_id, phone);

CREATE OR REPLACE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Agents (atendentes humanos)
CREATE TABLE IF NOT EXISTS agents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'agent'
                CHECK (role IN ('admin', 'supervisor', 'agent')),
  status      TEXT        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_agents_tenant ON agents(tenant_id, status);

CREATE OR REPLACE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Conversations (atendimentos)
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id   UUID        NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id     UUID        REFERENCES agents(id) ON DELETE SET NULL,
  status       TEXT        NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'pending', 'resolved', 'expired')),
  channel      TEXT        NOT NULL DEFAULT 'whatsapp'
                 CHECK (channel IN ('whatsapp', 'instagram', 'messenger')),
  metadata     JSONB       NOT NULL DEFAULT '{}',
  opened_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant        ON conversations(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_status ON conversations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_agent  ON conversations(tenant_id, agent_id);

CREATE OR REPLACE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Messages (mensagens de cada conversa)
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction       TEXT        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type            TEXT        NOT NULL DEFAULT 'text'
                    CHECK (type IN ('text', 'image', 'audio', 'video', 'document', 'sticker')),
  content         TEXT,
  media_url       TEXT,
  wa_message_id   TEXT,
  status          TEXT        NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  metadata        JSONB       NOT NULL DEFAULT '{}',
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tenant_id primeiro em todos os indices (sharding-ready para Citus)
CREATE INDEX IF NOT EXISTS idx_messages_tenant              ON messages(tenant_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_conversation ON messages(tenant_id, conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_wa_id              ON messages(tenant_id, wa_message_id) WHERE wa_message_id IS NOT NULL;
