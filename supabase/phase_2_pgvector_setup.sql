-- =============================================
-- PHASE 2: AI / RAG MEMORY LAYER (PGVECTOR)
-- =============================================

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to the questions table (3072 dimensions for Google's latest embedding model)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='embedding') THEN
    ALTER TABLE questions ADD COLUMN embedding vector(3072);
  ELSE
    -- We must drop the old index before altering the dimension, as hnsw doesn't support >2000
    DROP INDEX IF EXISTS questions_embedding_idx;
    ALTER TABLE questions ALTER COLUMN embedding TYPE vector(3072);
  END IF;
END $$;

-- 3. Create a function to search for similar questions
-- This will be used to ensure we don't generate duplicate questions 
-- and to fetch existing questions semantically.
CREATE OR REPLACE FUNCTION match_questions(
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_category_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  difficulty text,
  category_id text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question,
    q.answer,
    q.difficulty,
    q.category_id,
    1 - (q.embedding <=> query_embedding) AS similarity
  FROM questions q
  WHERE 
    q.embedding IS NOT NULL
    AND (p_category_id IS NULL OR q.category_id = p_category_id)
    AND 1 - (q.embedding <=> query_embedding) > match_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Fast similarity search will be performed using exact nearest neighbors (flat search).
-- We omit the HNSW index because pgvector restricts HNSW to 2000 dimensions or less,
-- and our model generates 3072 dimensions. Flat search is practically instant for <100k rows.

-- Reload schema
NOTIFY pgrst, 'reload schema';
