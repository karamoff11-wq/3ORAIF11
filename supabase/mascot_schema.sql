-- =============================================
-- Mascot System Schema & Policies
-- Run this in Supabase SQL Editor
-- =============================================

-- MASCOT SETTINGS
create table if not exists mascot_settings (
  id uuid primary key default gen_random_uuid(),
  enabled boolean default true,
  sarcasm_level int default 50,
  energy_level int default 50,
  voice_enabled boolean default true,
  voice_id text,
  updated_at timestamp with time zone default now()
);

-- MASCOT PHRASES
create table if not exists mascot_phrases (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'idle', 'correct', 'wrong', 'punishment', 'thinking', 'hype', 'intro'
  text text not null,
  audio_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- RLS
alter table mascot_settings enable row level security;
alter table mascot_phrases enable row level security;

-- Policies for mascot_settings
create policy "Anyone can read mascot_settings"
  on mascot_settings for select using (true);
create policy "Admins can update mascot_settings"
  on mascot_settings for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Policies for mascot_phrases
create policy "Anyone can read mascot_phrases"
  on mascot_phrases for select using (true);
create policy "Admins can manage mascot_phrases"
  on mascot_phrases for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Initial Seed Settings
insert into mascot_settings (enabled, sarcasm_level, energy_level, voice_enabled)
values (true, 80, 70, true)
on conflict do nothing;

-- Initial Seed Phrases (Palestinian Dialect)
insert into mascot_phrases (category, text) values
('intro', 'أهلاً بكم يا جماعة في العُريف! جاهزين للتحدي؟'),
('intro', 'يا هلا ويا مرحب! فرجوني شطارتكم اليوم.'),
('idle', 'يلا يا شباب، الوقت بيمر!'),
('idle', 'شو؟ نمتوا؟'),
('correct', 'يا عيني عليك! جواب صح مية بالمية.'),
('correct', 'والله إنك وحش! كفو.'),
('correct', 'صح! يبدو إنك مش قليل.'),
('wrong', 'يا خسارة! غلطة الشاطر بألف.'),
('wrong', 'لا لا لا! ركز شوي يا بطل.'),
('wrong', 'معلش معلش، الجايات أكتر من الرايحات.'),
('punishment', 'هيك بدكم؟ تحملوا النتيجة!'),
('thinking', 'أمممم... سؤال محير، شو رأيكم؟'),
('thinking', 'خلونا نفكر فيها شوي...'),
('hype', 'يا سلام! ولعت ولعت!'),
('hype', 'سلسلة إجابات صحيحة! أنتم أساطير!')
;
