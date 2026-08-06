-- Migration: 004_rls_policies
-- Description: Row-Level Security — isolamento completo entre tenants
-- IMPORTANTE: Service Role ignora RLS. Anon/Auth key respeita RLS.

-- ============================================================
-- FUNCAO DE CONTEXTO: define tenant_id da sessao corrente
-- ============================================================
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: retorna tenant_id do contexto atual (NULL se nao definido)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
EXCEPTION
  WHEN others THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- HABILITAR RLS
-- ============================================================
ALTER TABLE contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES — contacts
-- ============================================================
DROP POLICY IF EXISTS contacts_tenant_isolation ON contacts;
CREATE POLICY contacts_tenant_isolation ON contacts
  AS PERMISSIVE FOR ALL
  USING      (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ============================================================
-- POLICIES — agents
-- ============================================================
DROP POLICY IF EXISTS agents_tenant_isolation ON agents;
CREATE POLICY agents_tenant_isolation ON agents
  AS PERMISSIVE FOR ALL
  USING      (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ============================================================
-- POLICIES — conversations
-- ============================================================
DROP POLICY IF EXISTS conversations_tenant_isolation ON conversations;
CREATE POLICY conversations_tenant_isolation ON conversations
  AS PERMISSIVE FOR ALL
  USING      (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ============================================================
-- POLICIES — messages
-- ============================================================
DROP POLICY IF EXISTS messages_tenant_isolation ON messages;
CREATE POLICY messages_tenant_isolation ON messages
  AS PERMISSIVE FOR ALL
  USING      (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
