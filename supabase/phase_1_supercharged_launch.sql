-- =============================================
-- PHASE 1: SUPERCHARGED BACKEND (Part 2)
-- ONE-SHOT ATOMIC LAUNCH
-- =============================================

CREATE OR REPLACE FUNCTION public.launch_game_session_v2(
  p_session_id uuid,
  p_session_name text,
  p_teams jsonb,
  p_category_ids text[],
  p_punish_mode text,
  p_punishments jsonb
) RETURNS void AS $$
DECLARE
  v_team record;
  v_team_id uuid;
  v_team_ids uuid[];
BEGIN
  -- 1. Update Session basic info
  UPDATE sessions 
  SET name = p_session_name,
      state = 'playing',
      punishment_mode = p_punish_mode,
      punishments = p_punishments,
      current_question_index = 0,
      current_team_index = 0
  WHERE id = p_session_id;

  -- 2. Handle Teams (Atomic Delete/Insert)
  DELETE FROM teams WHERE session_id = p_session_id;
  
  -- Insert teams and collect IDs
  FOR v_team IN SELECT * FROM jsonb_to_recordset(p_teams) AS x(name text, color text)
  LOOP
    INSERT INTO teams (session_id, name, color, score)
    VALUES (p_session_id, v_team.name, v_team.color, 0)
    RETURNING id INTO v_team_id;
    v_team_ids := array_append(v_team_ids, v_team_id);
  END LOOP;

  -- 3. Handle Categories (Atomic Delete/Insert)
  DELETE FROM session_categories WHERE session_id = p_session_id;
  INSERT INTO session_categories (session_id, category_id)
  SELECT p_session_id, unnest(p_category_ids);

  -- 4. Select and Link Questions (Atomic and Balanced)
  DELETE FROM session_questions WHERE session_id = p_session_id;
  
  -- Selection Logic: 
  -- We take 5 questions per selected category.
  -- We shuffle them globally.
  INSERT INTO session_questions (session_id, question_id, category_id, difficulty, order_index)
  SELECT 
    p_session_id, 
    q.id, 
    q.category_id, 
    q.difficulty,
    row_number() OVER (ORDER BY random())
  FROM (
    SELECT id, category_id, difficulty,
           row_number() OVER (PARTITION BY category_id ORDER BY random()) as r
    FROM questions
    WHERE category_id = ANY(p_category_ids)
  ) q
  WHERE q.r <= 5;

  -- Reload schema cache notification
  -- NOTIFY pgrst, 'reload schema'; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.launch_game_session_v2(uuid, text, jsonb, text[], text, jsonb) TO anon, authenticated, service_role;
