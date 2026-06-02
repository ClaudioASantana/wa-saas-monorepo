-- Migration for Stripe Billing Integration
ALTER TABLE public.workspaces 
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_subscription_id text,
ADD COLUMN plan text DEFAULT 'starter',
ADD COLUMN subscription_status text DEFAULT 'active';
