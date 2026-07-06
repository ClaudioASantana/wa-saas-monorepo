-- Migration: Create users table for custom auth
-- Description: Stores user accounts for SaaS admin authentication (replaces Supabase Auth)

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for login queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- RLS disabled for now (custom auth handles permissions)