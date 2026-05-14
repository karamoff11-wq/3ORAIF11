-- =============================================
-- PHASE 1: SUPERCHARGED BACKEND (Part 3)
-- ATOMIC SESSION CREATION
-- =============================================

CREATE OR REPLACE FUNCTION public.create_session_atomic(
  p_host_id uuid,
  p_mode text
) RETURNS jsonb AS $$
DECLARE
  v_session_id uuid;
  v_join_code text;
  v_profile record;
BEGIN
  -- 1. Ensure Profile exists and get free_sessions_used
  SELECT * FROM profiles WHERE id = p_host_id INTO v_profile;
  
  IF v_profile IS NULL THEN
    INSERT INTO profiles (id) VALUES (p_host_id) RETURNING * INTO v_profile;
  END IF;

  -- 2. Generate unique join code (simple loop in SQL is faster than JS)
  LOOP
    v_join_code := upper(substring(md5(random()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM sessions WHERE join_code = v_join_code);
  END LOOP;

  -- 3. Create Session
  INSERT INTO sessions (host_id, mode, state, join_code, current_question_index, current_team_index)
  VALUES (p_host_id, p_mode, 'lobby', v_join_code, 0, 0)
  RETURNING id INTO v_session_id;

  -- 4. Mark free session used
  IF NOT v_profile.free_sessions_used THEN
    UPDATE profiles SET free_sessions_used = true WHERE id = p_host_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_session_id,
    'join_code', v_join_code,
    'mode', p_mode
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.create_session_atomic(uuid, text) TO anon, authenticated, service_role;
