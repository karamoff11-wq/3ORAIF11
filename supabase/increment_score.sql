-- Fix for BUG 6: Race condition in score updates
-- Run this in Supabase SQL Editor

create or replace function increment_team_score(team_id uuid, points_to_add int)
returns void as $$
begin
  update teams 
  set score = score + points_to_add 
  where id = team_id;
end;
$$ language plpgsql security definer;
