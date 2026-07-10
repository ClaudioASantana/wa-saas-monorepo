-- Migration 006: Password Reset Tokens
-- Criado em: 2026-07-09
-- Descrição: Tabela para armazenar tokens temporários de recuperação de senha

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Índice para busca por agent_id
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_agent_id ON password_reset_tokens(agent_id);

-- Índice para limpeza de tokens expirados
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Comentários para documentação
COMMENT ON TABLE password_reset_tokens IS 'Armazena tokens temporários para recuperação de senha com TTL de 1 hora';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único gerado com crypto.randomBytes (hashed)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data/hora de expiração do token (1 hora após criação)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Data/hora em que o token foi usado (null = não usado)';
