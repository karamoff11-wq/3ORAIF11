-- =============================================
-- Team-vs-Team Game Board Schema Update
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add team_id to session_questions to explicitly bind questions to teams
ALTER TABLE session_questions ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE CASCADE;

-- If you ever need to reset or clean up orphan session_questions
-- DELETE FROM session_questions WHERE team_id IS NULL;
