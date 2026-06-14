-- Migration: Add unique constraints for conversation and contact upserts
-- Fixes C10 (contacts upsert) and C11 (conversations upsert) crash

-- C11: Conversations are upserted on (channel_id, contact_id)
-- The pair uniquely identifies a conversation between a channel and a contact.
ALTER TABLE public.conversations
  ADD CONSTRAINT uq_conversations_channel_contact
  UNIQUE (channel_id, contact_id);

-- C10: Contacts are upserted on (workspace_id, phone)
-- A phone number is unique per workspace (same contact can exist in multiple workspaces).
ALTER TABLE public.contacts
  ADD CONSTRAINT uq_contacts_workspace_phone
  UNIQUE (workspace_id, phone);
