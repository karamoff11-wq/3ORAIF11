-- =============================================
-- PHASE 1: SUPERCHARGED BACKEND (BULLETPROOF)
-- ATOMIC SESSION CREATION & LAUNCH
-- =============================================

-- 1. Bulletproof Atomic Creation
CREATE OR REPLACE FUNCTION public.create_session_atomic(params jsonb)
RETURNS jsonb AS $$
DECLARE
  v_host_id uuid := (params->>'p_host_id')::uuid;
  v_mode text := params->>'p_mode';
  v_session_id uuid;
  v_join_code text;
  v_profile record;
BEGIN
  -- 1. Ensure Profile exists and get free_sessions_used
  SELECT * FROM profiles WHERE id = v_host_id INTO v_profile;
  
  IF v_profile IS NULL THEN
    INSERT INTO profiles (id) VALUES (v_host_id) RETURNING * INTO v_profile;
  END IF;

  -- 2. Generate unique join code
  LOOP
    v_join_code := upper(substring(md5(random()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM sessions WHERE join_code = v_join_code);
  END LOOP;

  -- 3. Create Session
  INSERT INTO sessions (host_id, mode, state, join_code, current_question_index, current_team_index)
  VALUES (v_host_id, v_mode, 'lobby', v_join_code, 0, 0)
  RETURNING id INTO v_session_id;

  -- 4. Mark free session used
  IF NOT COALESCE(v_profile.free_sessions_used, false) THEN
    UPDATE profiles SET free_sessions_used = true WHERE id = v_host_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_session_id,
    'join_code', v_join_code,
    'mode', v_mode
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bulletproof Atomic Launch
-- First, ensure the required columns exist on the sessions table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='name') THEN
    ALTER TABLE sessions ADD COLUMN name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='punishment_mode') THEN
    ALTER TABLE sessions ADD COLUMN punishment_mode text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='punishments') THEN
    ALTER TABLE sessions ADD COLUMN punishments jsonb;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.launch_game_session_v2(params jsonb)
RETURNS void AS $$
DECLARE
  v_session_id uuid := (params->>'p_session_id')::uuid;
  v_session_name text := params->>'p_session_name';
  v_teams jsonb := params->'p_teams';
  v_category_ids text[] := Array(SELECT jsonb_array_elements_text(params->'p_category_ids'));
  v_punish_mode text := params->>'p_punish_mode';
  v_punishments jsonb := params->'p_punishments';
  v_team record;
BEGIN
  -- 1. Update Session basic info (Keep state as lobby until questions are generated)
  UPDATE sessions 
  SET name = v_session_name,
      state = 'lobby',
      punishment_mode = v_punish_mode,
      punishments = v_punishments,
      current_question_index = 0,
      current_team_index = 0
  WHERE id = v_session_id;

  -- 2. Handle Teams (Atomic Delete/Insert)
  DELETE FROM teams WHERE session_id = v_session_id;
  FOR v_team IN SELECT * FROM jsonb_to_recordset(v_teams) AS x(name text, color text)
  LOOP
    INSERT INTO teams (session_id, name, color, score)
    VALUES (v_session_id, v_team.name, v_team.color, 0);
  END LOOP;

  -- 3. Handle Categories (Atomic Delete/Insert)
  DELETE FROM session_categories WHERE session_id = v_session_id;
  INSERT INTO session_categories (session_id, category_id)
  SELECT v_session_id, unnest(v_category_ids);
  
  -- session_questions linking is now handled by the AI generator (gameEngine.generateQuestions)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION public.create_session_atomic(jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.launch_game_session_v2(jsonb) TO anon, authenticated, service_role;

-- Reload
NOTIFY pgrst, 'reload schema';
