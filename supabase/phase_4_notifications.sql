-- ================================================================
--  PHASE 4 — ADMIN NOTIFICATIONS TABLE
--  Run this in the Supabase SQL Editor (once).
-- ================================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text NOT NULL DEFAULT 'info', -- 'warning' | 'error' | 'info' | 'success'
  title       text NOT NULL,
  message     text NOT NULL,
  read        boolean DEFAULT false NOT NULL,
  action_url  text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_read       ON public.admin_notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created    ON public.admin_notifications (created_at DESC);

-- RLS: Only service_role writes; only admins read
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read notifications"
  ON public.admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin update notifications"
  ON public.admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

GRANT ALL ON public.admin_notifications TO service_role;
GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;

-- Auto-prune: keep only last 500 notifications
-- (Enable pg_cron extension first if desired)
/*
SELECT cron.schedule(
  'prune-notifications',
  '0 4 * * *',
  $$
    DELETE FROM public.admin_notifications
    WHERE id NOT IN (
      SELECT id FROM public.admin_notifications
      ORDER BY created_at DESC LIMIT 500
    );
  $$
);
*/
