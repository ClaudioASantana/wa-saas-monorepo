-- supabase/migrations/20260312000001_add_contact_status.sql
-- Migration: Adiciona campo is_active a tabela contacts
-- Story 1.4 - Pagina de Contatos

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.contacts.is_active IS 'Indica se o contato esta ativo no workspace';
