-- Migration: 001_create_tenants
-- Description: Tabela de tenants (sem RLS — gerenciada pelo service role)
-- Rollback: DROP TABLE IF EXISTS tenants;

CREATE TABLE IF NOT EXISTS tenants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        UNIQUE NOT NULL,
  plan       TEXT        NOT NULL DEFAULT 'free'
               CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  status     TEXT        NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para lookup por slug (login, subdomain routing)
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
