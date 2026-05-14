-- ================================================================
--  PHASE 6 — TIER 5 SMART CLUSTERING
--  Run this in the Supabase SQL Editor.
-- ================================================================

-- ── 1. Add Sub-Topic Column ────────────────────────────────────
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='questions' AND column_name='sub_topic'
  ) THEN
    ALTER TABLE public.questions ADD COLUMN sub_topic text;
  END IF;
END $$;

-- ── 2. Vector Density Clustering Algorithm ─────────────────────
-- Finds "dense pockets" of similar questions in the vector space
-- and automatically groups them into sub-topics.
CREATE OR REPLACE FUNCTION public.cluster_questions_nightly()
RETURNS void AS $$
DECLARE
  v_cat_record record;
  v_seed_q record;
  v_cluster_name text;
  v_count int;
BEGIN
  -- Iterate through categories
  FOR v_cat_record IN SELECT id FROM categories LOOP
    
    -- Pick questions without a sub_topic to act as cluster seeds
    FOR v_seed_q IN 
      SELECT id, embedding FROM questions 
      WHERE category_id = v_cat_record.id 
        AND sub_topic IS NULL 
        AND embedding IS NOT NULL
      LIMIT 100 -- Process in safe batches
    LOOP
      -- Verify seed wasn't tagged in a previous inner loop iteration
      IF EXISTS (SELECT 1 FROM questions WHERE id = v_seed_q.id AND sub_topic IS NOT NULL) THEN
        CONTINUE;
      END IF;

      -- Measure density: How many questions are very close to this seed?
      -- Cosine distance < 0.15 indicates very high semantic similarity
      SELECT COUNT(*) INTO v_count
      FROM questions
      WHERE category_id = v_cat_record.id
        AND sub_topic IS NULL
        AND embedding IS NOT NULL
        AND (embedding <=> v_seed_q.embedding) < 0.15;
        
      -- If we find a dense cluster of at least 5 similar questions:
      IF v_count >= 5 THEN
        -- Generate a unique cluster ID
        v_cluster_name := 'cluster_' || substring(md5(random()::text) from 1 for 6);
        
        -- Mass update the cluster
        UPDATE questions
        SET sub_topic = v_cluster_name
        WHERE category_id = v_cat_record.id
          AND sub_topic IS NULL
          AND embedding IS NOT NULL
          AND (embedding <=> v_seed_q.embedding) < 0.15;
          
        RAISE NOTICE 'Auto-discovered sub-topic % with % questions', v_cluster_name, v_count;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ── 3. Nightly Cron Job ────────────────────────────────────────
-- Uses Supabase's built-in pg_cron to run this every night at 2:00 AM
-- Ensure pg_cron extension is enabled first:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Un-schedule first to allow safe re-runs (ignores error if job doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('nightly-clustering');
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore
END $$;

-- Schedule the job
SELECT cron.schedule(
  'nightly-clustering', 
  '0 2 * * *', -- 2:00 AM every day
  $$SELECT public.cluster_questions_nightly()$$
);
