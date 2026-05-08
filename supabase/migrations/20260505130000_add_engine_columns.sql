-- Add difficulty column to session_categories
alter table session_categories add column if not exists difficulty text default 'medium';

-- Add difficulty column to session_questions if not exists (it should exist based on init_schema but just in case)
-- init_schema has it in session_questions? No, it has it in questions.
-- Wait, init_schema line 85: session_questions doesn't have difficulty.
-- init_schema line 74: questions has difficulty.
-- session_questions line 380 of gameEngine.ts attempts to set difficulty on session_questions.
-- Let's check init_schema again.

-- Line 85:
-- create table if not exists session_questions (
--   id uuid primary key default gen_random_uuid(),
--   session_id uuid references sessions(id) on delete cascade,
--   question_id uuid references questions(id) on delete cascade,
--   category_id uuid references categories(id) on delete set null,
--   order_index int,
--   used boolean default false
-- );
-- It MISSES difficulty! But gameEngine.ts line 380 sets it. This is a BUG in the schema vs engine.

alter table session_questions add column if not exists difficulty text;
alter table session_questions add column if not exists team_id uuid references teams(id) on delete cascade;
