-- ========================================================
-- PHASE 1: POWER BACKEND - ATOMIC DATABASE OPERATIONS
-- Improvements: Speed, Atomicity, and Reduced Latency
-- ========================================================

-- 1. Optimized Session Setup
-- Handles session creation/updates and category linking in one transaction.
create or replace function setup_game_session(
    p_host_id uuid,
    p_mode text,
    p_category_ids text[],
    p_session_id uuid
)
returns uuid as $$
declare
    v_session_id uuid;
    v_join_code text;
begin
    -- 1. Ensure Profile exists (fixes race condition)
    insert into profiles (id) 
    values (p_host_id) 
    on conflict (id) do nothing;

    -- 2. Create or Update Session
    if p_session_id is null then
        -- Generate unique join code for remote sessions
        if p_mode = 'remote' then
            v_join_code := upper(substring(md5(random()::text) from 1 for 6));
        else
            v_join_code := null;
        end if;

        insert into sessions (host_id, mode, state, join_code)
        values (p_host_id, p_mode, 'lobby', v_join_code)
        returning id into v_session_id;
    else
        v_session_id := p_session_id;
        update sessions set 
            mode = p_mode,
            state = 'lobby'
        where id = v_session_id;
    end if;

    -- 3. Link Categories (Clean and Insert)
    delete from session_categories where session_id = v_session_id;
    
    insert into session_categories (session_id, category_id)
    select v_session_id, unnest(p_category_ids);

    return v_session_id;
end;
$$ language plpgsql security definer;

-- 2. Optimized Question Assignment
-- Bulk links questions to session/teams in a single call.
create or replace function link_session_questions(
    p_session_id uuid,
    p_question_data jsonb -- Format: [{"question_id": "...", "team_id": "...", "difficulty": "...", "category_id": "...", "order_index": 0}]
)
returns void as $$
begin
    -- Cleanup old questions for this session
    delete from session_questions where session_id = p_session_id;

    -- Insert new links from JSON
    insert into session_questions (
        session_id, 
        question_id, 
        team_id, 
        difficulty, 
        category_id, 
        order_index
    )
    select 
        p_session_id,
        (obj->>'question_id')::uuid,
        (obj->>'team_id')::uuid,
        (obj->>'difficulty'),
        (obj->>'category_id'),
        (obj->>'order_index')::int
    from jsonb_array_elements(p_question_data) as obj;
    
    -- Transition session to playing state
    update sessions set state = 'playing' where id = p_session_id;
end;
$$ language plpgsql security definer;

-- 3. Smart Score & Turn Manager
-- Handles scoring and moving to next turn in one atomic step.
create or replace function process_answer_and_next_turn(
    p_session_id uuid,
    p_team_id uuid,
    p_points int,
    p_next_team_index int,
    p_session_question_id uuid
)
returns void as $$
begin
    -- 1. Update Score
    if p_points != 0 then
        update teams set score = score + p_points where id = p_team_id;
    end if;

    -- 2. Mark Question as Used
    update session_questions set used = true where id = p_session_question_id;

    -- 3. Update Session Turn and Progress Index
    update sessions set 
        current_team_index = p_next_team_index,
        current_question_index = current_question_index + 1
    where id = p_session_id;
end;
$$ language plpgsql security definer;

-- 4. High-Performance Game State Fetch
-- Fetches everything a client needs in a single compressed JSON response.
create or replace function get_complete_game_state(p_session_id uuid)
returns jsonb as $$
declare
    v_result jsonb;
begin
    select jsonb_build_object(
        'session', (select row_to_json(s) from sessions s where id = p_session_id),
        'teams', (select jsonb_agg(t) from teams t where session_id = p_session_id),
        'questions', (
            select jsonb_agg(jsonb_build_object(
                'id', sq.id,
                'question_id', sq.question_id,
                'team_id', sq.team_id,
                'difficulty', sq.difficulty,
                'category_id', sq.category_id,
                'order_index', sq.order_index,
                'used', sq.used,
                'content', (select row_to_json(q) from questions q where q.id = sq.question_id)
            ))
            from session_questions sq
            where sq.session_id = p_session_id
            order by sq.order_index
        ),
        'categories', (
            select jsonb_agg(c) 
            from categories c 
            where c.id in (select category_id from session_categories where session_id = p_session_id)
        ),
        'config', (select row_to_json(sc) from scoring_config sc limit 1)
    ) into v_result;

    return v_result;
end;
$$ language plpgsql security definer;
