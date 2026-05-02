-- Cleanup duplicates and prevent future ones
-- Run this in Supabase SQL Editor

-- 1. Remove duplicates based on category and question text
DELETE FROM questions
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY category_id, question ORDER BY created_at ASC) as row_num
        FROM questions
    ) t
    WHERE t.row_num > 1
);

-- 2. Add unique constraint so it doesn't happen again
ALTER TABLE questions 
DROP CONSTRAINT IF EXISTS unique_question_per_category;

ALTER TABLE questions 
ADD CONSTRAINT unique_question_per_category UNIQUE (category_id, question);

-- 3. Confirm count
SELECT count(*) FROM questions;
