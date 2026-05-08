-- =============================================
-- Stage 2 Migration: Add plan_type to profiles
-- and plan_type to subscriptions
-- Run this in Supabase SQL Editor
-- =============================================

-- Add plan_type column to profiles (fast reads without joins)
alter table profiles
  add column if not exists plan_type text not null default 'free'
  check (plan_type in ('free', 'pro', 'team'));

-- Add plan_type to subscriptions table
alter table subscriptions
  add column if not exists plan_type text not null default 'free'
  check (plan_type in ('free', 'pro', 'team'));

-- Index for fast plan lookups
create index if not exists idx_profiles_plan_type on profiles(plan_type);

-- Allow webhook (service role) to update plan_type
-- Note: This runs as the service role, so no RLS needed for the webhook
-- But admins should be able to override manually:
drop policy if exists "Admins can update any profile plan" on profiles;
create policy "Admins can update any profile plan"
  on profiles for update
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- =============================================
-- Helper function: get_user_plan
-- Usage: select get_user_plan(auth.uid())
-- =============================================
create or replace function get_user_plan(p_user_id uuid)
returns text as $$
  select coalesce(plan_type, 'free')
  from profiles
  where id = p_user_id
$$ language sql stable security definer;
