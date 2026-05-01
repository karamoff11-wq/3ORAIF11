-- =============================================
-- Abu Al-Areef Trivia — Full Production Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- PROFILES (extends Supabase Auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'user', -- 'user' | 'admin'
  created_at timestamp with time zone default now(),
  free_sessions_used boolean default false
);

-- SUBSCRIPTIONS
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  paddle_subscription_id text,
  status text, -- active | canceled | past_due
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- SESSIONS
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references profiles(id) on delete cascade,
  mode text not null, -- local | remote
  state text default 'lobby', -- lobby | playing | finished
  join_code text unique,
  current_question_index int default 0,
  current_team_index int default 0,
  created_at timestamp with time zone default now()
);

-- TEAMS
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  color text not null,
  score int default 0,
  created_at timestamp with time zone default now()
);

-- PLAYERS
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- TOPICS
create table if not exists topics (
  id text primary key,
  name text not null,
  icon text,
  color text,
  order_index int default 0,
  created_at timestamp with time zone default now()
);

-- CATEGORIES
create table if not exists categories (
  id text primary key,
  topic_id text references topics(id) on delete cascade,
  name text not null,
  icon text,
  order_index int default 0,
  created_at timestamp with time zone default now()
);

-- THEMES
create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean default false,
  config jsonb not null,
  created_at timestamp with time zone default now()
);

-- QUESTIONS
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  category_id text references categories(id) on delete set null,
  difficulty text not null, -- easy | medium | hard
  question text not null,
  answer text not null,
  media_url text,
  created_at timestamp with time zone default now()
);

-- SESSION QUESTIONS (bridge: questions selected for a session)
create table if not exists session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  category_id text references categories(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  difficulty text, -- denormalized for fast access
  order_index int,
  used boolean default false,
  created_at timestamp with time zone default now()
);

-- SESSION CATEGORIES (categories selected for a session)
create table if not exists session_categories (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  category_id text references categories(id) on delete cascade
);

-- SCORING CONFIG
create table if not exists scoring_config (
  id text primary key default 'default',
  easy_points int default 100,
  medium_points int default 200,
  hard_points int default 300,
  default_timer_seconds int default 30,
  updated_at timestamp with time zone default now(),
  constraint scoring_config_singleton check (id = 'default')
);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- session | subscription
  status text not null, -- pending | completed | failed
  paddle_transaction_id text,
  amount numeric,
  currency text,
  created_at timestamp with time zone default now()
);

-- =============================================
-- INDEXES
-- =============================================
create index if not exists idx_sessions_host_id on sessions(host_id);
create index if not exists idx_sessions_join_code on sessions(join_code);
create index if not exists idx_teams_session_id on teams(session_id);
create index if not exists idx_players_session_id on players(session_id);
create index if not exists idx_players_team_id on players(team_id);
create index if not exists idx_questions_category_id on questions(category_id);
create index if not exists idx_questions_difficulty on questions(difficulty);
create index if not exists idx_session_questions_session_id on session_questions(session_id);
create index if not exists idx_session_questions_used on session_questions(used);
create index if not exists idx_questions_difficulty_category on questions(category_id, difficulty);
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create unique index if not exists idx_questions_unique on questions(category_id, lower(question));

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table sessions enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table topics enable row level security;
alter table categories enable row level security;
alter table themes enable row level security;
alter table questions enable row level security;
alter table session_questions enable row level security;
alter table session_categories enable row level security;
alter table payments enable row level security;
alter table scoring_config enable row level security;

-- PROFILES policies
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- SUBSCRIPTIONS policies
create policy "Users can view own subscription"
  on subscriptions for select using (auth.uid() = user_id);

-- SESSIONS policies
create policy "Host can manage own sessions"
  on sessions for all using (auth.uid() = host_id);
create policy "Anyone can read session by join_code"
  on sessions for select using (true);

-- TEAMS policies
create policy "Anyone can read teams"
  on teams for select using (true);
create policy "Host can manage teams"
  on teams for all using (
    auth.uid() = (select host_id from sessions where id = teams.session_id)
  )
  with check (
    auth.uid() = (select host_id from sessions where id = teams.session_id)
  );

-- PLAYERS policies
create policy "Anyone can read players"
  on players for select using (true);
create policy "Anyone can insert player"
  on players for insert with check (
    exists (select 1 from sessions where id = players.session_id and state = 'lobby')
  );

-- TOPICS policies
create policy "Anyone can read topics"
  on topics for select using (true);
create policy "Admins can manage topics"
  on topics for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- CATEGORIES policies
create policy "Anyone can read categories"
  on categories for select using (true);
create policy "Admins can manage categories"
  on categories for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- THEMES policies
create policy "Anyone can read themes"
  on themes for select using (true);
create policy "Admins can manage themes"
  on themes for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- QUESTIONS policies
create policy "Anyone can read questions"
  on questions for select using (true);
create policy "Admins can manage questions"
  on questions for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- SESSION QUESTIONS policies
create policy "Host can manage session_questions"
  on session_questions for all using (
    auth.uid() = (select host_id from sessions where id = session_questions.session_id)
  )
  with check (
    auth.uid() = (select host_id from sessions where id = session_questions.session_id)
  );
create policy "Anyone can read session_questions"
  on session_questions for select using (true);

-- SESSION CATEGORIES policies
create policy "Anyone can read session_categories"
  on session_categories for select using (true);
create policy "Host can manage session_categories"
  on session_categories for all using (
    auth.uid() = (select host_id from sessions where id = session_categories.session_id)
  )
  with check (
    auth.uid() = (select host_id from sessions where id = session_categories.session_id)
  );

-- SCORING CONFIG policies
create policy "Anyone can read scoring config"
  on scoring_config for select using (true);
create policy "Admins can update scoring config"
  on scoring_config for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- PAYMENTS policies
create policy "Users can view own payments"
  on payments for select using (auth.uid() = user_id);

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- =============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================
-- ENABLE REALTIME on key tables
-- =============================================
-- Run these in Supabase Dashboard > Database > Replication
-- or via: alter publication supabase_realtime add table sessions;
-- alter publication supabase_realtime add table teams;
-- alter publication supabase_realtime add table players;
-- alter publication supabase_realtime add table session_questions;

-- =============================================
on conflict do nothing;

-- =============================================
-- FUNCTIONS: Team Scoring (Fix for BUG 6)
-- =============================================
create or replace function increment_team_score(team_id uuid, points_to_add int)
returns void as $$
begin
  update teams set score = score + points_to_add where id = team_id;
end;
$$ language plpgsql security definer;


-- End of Schema
