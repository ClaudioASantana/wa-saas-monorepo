-- Migration: 013_create_routing_config
-- Description: Create routing configuration table
-- Rollback: DROP TABLE IF EXISTS routing_config;

CREATE TABLE IF NOT EXISTS routing_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  round_robin_enabled BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 0,
  tag_routing JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
