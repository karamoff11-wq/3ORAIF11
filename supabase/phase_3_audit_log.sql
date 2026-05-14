-- ================================================================
--  PHASE 3 — AUDIT LOG & SECURITY
--  Run this in the Supabase SQL Editor (once).
-- ================================================================

-- ── 1. Admin Audit Log Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  target_id   text,
  payload     jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Index for fast lookups by admin and time
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id  ON public.admin_audit_log (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created   ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action    ON public.admin_audit_log (action);

-- ── 2. Row Level Security ─────────────────────────────────────────
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log
CREATE POLICY "Admin read audit log"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Only the service role (server-side) can insert
-- (No INSERT policy = only service_role key can write)

-- ── 3. Auto-prune old entries (keep last 90 days) ─────────────────
-- Requires pg_cron extension. Enable it in Supabase → Extensions first.
-- Once enabled, uncomment the block below:

/*
SELECT cron.schedule(
  'prune-audit-log',
  '0 3 * * *',  -- 3 AM every day
  $$
    DELETE FROM public.admin_audit_log
    WHERE created_at < now() - INTERVAL '90 days';
  $$
);
*/

-- ── 4. Convenience view: Audit log with admin email ───────────────
CREATE OR REPLACE VIEW public.admin_audit_log_view AS
  SELECT
    a.id,
    a.created_at,
    a.action,
    a.target_id,
    a.payload,
    u.email AS admin_email
  FROM public.admin_audit_log a
  LEFT JOIN auth.users u ON u.id = a.admin_id
  ORDER BY a.created_at DESC;

-- Grant admins access to the view
GRANT SELECT ON public.admin_audit_log_view TO authenticated;

-- ── 5. Grant service_role full access ─────────────────────────────
GRANT ALL ON public.admin_audit_log TO service_role;
