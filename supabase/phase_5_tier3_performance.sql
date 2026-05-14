-- ================================================================
--  PHASE 5 — TIER 3 BACKEND PERFORMANCE
--  Run this in the Supabase SQL Editor (once).
-- ================================================================

-- ── 3.3 pgvector Deduplication Trigger ─────────────────────────────
-- Blocks insertion of questions that are too similar to existing ones
-- in the same category. Uses cosine distance on the `embedding` vector.
-- Threshold: 0.08 (lower = stricter dedup)

CREATE OR REPLACE FUNCTION prevent_duplicate_questions()
RETURNS trigger AS $$
DECLARE
  similar_count int;
BEGIN
  -- Only check if the new row has an embedding
  IF NEW.embedding IS NOT NULL THEN
    SELECT COUNT(*) INTO similar_count
    FROM questions
    WHERE category_id = NEW.category_id
      AND embedding IS NOT NULL
      AND id != NEW.id
      AND (embedding <=> NEW.embedding) < 0.08; -- cosine distance threshold

    IF similar_count > 0 THEN
      RAISE EXCEPTION 'DUPLICATE_QUESTION: Too similar to an existing question in this category';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists first so re-runs are idempotent
DROP TRIGGER IF EXISTS enforce_question_uniqueness ON public.questions;

CREATE TRIGGER enforce_question_uniqueness
  BEFORE INSERT ON public.questions
  FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_questions();


-- ── 3.1 cache-support: quick lookup index ──────────────────────────
-- Speeds up getCachedQuestionIds DB fallback path
CREATE INDEX IF NOT EXISTS idx_questions_cat_diff
  ON public.questions (category_id, difficulty, created_at DESC);


-- ── AI Usage Log (supports 4.2 Cost Tracker) ───────────────────────
-- Log every Gemini call to track token spend
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  model         text NOT NULL DEFAULT 'gemini-flash-latest',
  input_tokens  int,
  output_tokens int,
  latency_ms    int,
  category_id   text REFERENCES public.categories(id) ON DELETE SET NULL,
  used_fallback boolean DEFAULT false,
  used_cache    boolean DEFAULT false,
  created_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON public.ai_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_session  ON public.ai_usage_log (session_id);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Admins can read; service_role writes
CREATE POLICY "Admin read ai_usage_log"
  ON public.ai_usage_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

GRANT ALL ON public.ai_usage_log TO service_role;
GRANT SELECT ON public.ai_usage_log TO authenticated;


-- ── Quality score columns (supports 2.2) ───────────────────────────
-- Idempotent — skips if columns already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'quality_score'
  ) THEN
    ALTER TABLE public.questions ADD COLUMN quality_score float DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'quality_flag'
  ) THEN
    ALTER TABLE public.questions ADD COLUMN quality_flag text DEFAULT NULL;
    -- Values: 'low' | 'medium' | 'high'
  END IF;
END $$;
