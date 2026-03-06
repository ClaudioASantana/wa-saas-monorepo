-- Migration: 004_grants
-- Description: Grants de acesso para roles do Supabase
-- anon: acesso publico (respeita RLS)
-- authenticated: usuarios autenticados (respeita RLS)
-- service_role: bypass total de RLS (apenas backend admin)

-- Tenants: readonly para anon/authenticated (sem RLS — gerenciada pelo service role)
GRANT SELECT ON tenants TO anon, authenticated;

-- Tabelas protegidas por RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agents        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages      TO anon, authenticated;

-- Funcoes de contexto acessiveis para roles nao-superuser
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION current_tenant_id()       TO anon, authenticated;
