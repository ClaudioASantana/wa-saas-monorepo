-- Migration: 005_auth_setup
-- Description: Adiciona coluna password_hash na tabela agents para permitir autenticação via banco de dados
-- Rollback: ALTER TABLE agents DROP COLUMN IF EXISTS password_hash;

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS password_hash TEXT;
