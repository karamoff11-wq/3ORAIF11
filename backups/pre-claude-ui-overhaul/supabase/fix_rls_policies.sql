-- =============================================
-- FIX: Row-Level Security Policies for Session items
-- =============================================

-- 1. Fix session_categories policies
drop policy if exists "Anyone can read session_categories" on session_categories;
create policy "Anyone can read session_categories" 
  on session_categories for select using (true);

drop policy if exists "Host can manage session_categories" on session_categories;
create policy "Host can manage session_categories" 
  on session_categories for all 
  using (
    auth.uid() = (select host_id from sessions where id = session_categories.session_id)
  )
  with check (
    auth.uid() = (select host_id from sessions where id = session_categories.session_id)
  );

-- 2. Fix session_questions policies
drop policy if exists "Anyone can read session_questions" on session_questions;
create policy "Anyone can read session_questions" 
  on session_questions for select using (true);

drop policy if exists "Host can manage session_questions" on session_questions;
create policy "Host can manage session_questions" 
  on session_questions for all 
  using (
    auth.uid() = (select host_id from sessions where id = session_questions.session_id)
  )
  with check (
    auth.uid() = (select host_id from sessions where id = session_questions.session_id)
  );

-- 3. Fix teams policies
drop policy if exists "Anyone can read teams" on teams;
create policy "Anyone can read teams" 
  on teams for select using (true);

drop policy if exists "Host can manage teams" on teams;
create policy "Host can manage teams" 
  on teams for all 
  using (
    auth.uid() = (select host_id from sessions where id = teams.session_id)
  )
  with check (
    auth.uid() = (select host_id from sessions where id = teams.session_id)
  );

-- 4. Fix players policies
drop policy if exists "Anyone can read players" on players;
create policy "Anyone can read players" 
  on players for select using (true);

drop policy if exists "Anyone can insert player" on players;
create policy "Anyone can insert player" 
  on players for insert with check (true);

drop policy if exists "Host can update players" on players;
create policy "Host can update players" 
  on players for update using (
    auth.uid() = (select host_id from sessions where id = players.session_id)
  );

drop policy if exists "Host can delete players" on players;
create policy "Host can delete players" 
  on players for delete using (
    auth.uid() = (select host_id from sessions where id = players.session_id)
  );

-- 5. Extra Safety: Ensure host can view their own profile/session clearly
drop policy if exists "Host can manage own sessions" on sessions;
create policy "Host can manage own sessions" 
  on sessions for all using (auth.uid() = host_id);
