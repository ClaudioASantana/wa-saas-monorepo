-- Migration: 012_rename_tags_workspace_id
-- Description: Renomeia a coluna workspace_id para tenant_id na tabela tags por consistência
-- Rollback: ALTER TABLE tags RENAME COLUMN tenant_id TO workspace_id; ALTER INDEX idx_tags_tenant RENAME TO idx_tags_workspace;

ALTER TABLE tags RENAME COLUMN workspace_id TO tenant_id;
ALTER INDEX idx_tags_workspace RENAME TO idx_tags_tenant;
