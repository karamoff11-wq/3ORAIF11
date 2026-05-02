import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const client = new pg.Client({
  connectionString: 'postgresql://postgres.mbqonwwoazurvkxrffqx:Karam6969Karam@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  console.log('✅ Connected to Supabase PostgreSQL')

  // --- SCHEMA ---
  console.log('\n🔧 Applying schema...')
  await client.query(`
    create table if not exists profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      email text,
      role text default 'user',
      created_at timestamp with time zone default now(),
      free_sessions_used boolean default false
    );

    create table if not exists subscriptions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references profiles(id) on delete cascade,
      paddle_subscription_id text,
      status text,
      current_period_end timestamp with time zone,
      created_at timestamp with time zone default now()
    );

    create table if not exists sessions (
      id uuid primary key default gen_random_uuid(),
      host_id uuid references profiles(id) on delete cascade,
      mode text not null,
      state text default 'lobby',
      join_code text unique,
      current_question_index int default 0,
      current_team_index int default 0,
      created_at timestamp with time zone default now()
    );

    create table if not exists teams (
      id uuid primary key default gen_random_uuid(),
      session_id uuid references sessions(id) on delete cascade,
      name text not null,
      color text not null,
      score int default 0,
      created_at timestamp with time zone default now()
    );

    create table if not exists players (
      id uuid primary key default gen_random_uuid(),
      session_id uuid references sessions(id) on delete cascade,
      team_id uuid references teams(id) on delete set null,
      name text not null,
      created_at timestamp with time zone default now()
    );

    create table if not exists categories (
      id text primary key,
      name text not null,
      icon text,
      created_at timestamp with time zone default now()
    );

    create table if not exists themes (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      is_default boolean default false,
      config jsonb not null,
      created_at timestamp with time zone default now()
    );

    create table if not exists questions (
      id uuid primary key default gen_random_uuid(),
      category_id text references categories(id) on delete set null,
      difficulty text not null,
      question text not null,
      answer text not null,
      media_url text,
      created_at timestamp with time zone default now()
    );

    create table if not exists session_questions (
      id uuid primary key default gen_random_uuid(),
      session_id uuid references sessions(id) on delete cascade,
      question_id uuid references questions(id) on delete cascade,
      category_id text references categories(id) on delete set null,
      order_index int,
      used boolean default false
    );

    create table if not exists session_categories (
      id uuid primary key default gen_random_uuid(),
      session_id uuid references sessions(id) on delete cascade,
      category_id text references categories(id) on delete cascade
    );

    create table if not exists scoring_config (
      id uuid primary key default gen_random_uuid(),
      easy_points int default 100,
      medium_points int default 200,
      hard_points int default 300,
      default_timer_seconds int default 30,
      updated_at timestamp with time zone default now()
    );

    create table if not exists payments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references profiles(id) on delete cascade,
      type text not null,
      status text not null,
      paddle_transaction_id text,
      amount numeric,
      currency text,
      created_at timestamp with time zone default now()
    );
  `)
  console.log('✅ Tables created')

  // --- RLS ---
  console.log('\n🔒 Enabling RLS...')
  for (const table of ['profiles','subscriptions','sessions','teams','players','categories','themes','questions','session_questions','session_categories','payments','scoring_config']) {
    await client.query(`alter table ${table} enable row level security;`)
  }
  console.log('✅ RLS enabled')

  // --- POLICIES (drop + recreate to avoid conflict) ---
  console.log('\n📋 Creating policies...')
  const policies = [
    [`drop policy if exists "Users can view own profile" on profiles`, `create policy "Users can view own profile" on profiles for select using (auth.uid() = id)`],
    [`drop policy if exists "Users can update own profile" on profiles`, `create policy "Users can update own profile" on profiles for update using (auth.uid() = id)`],
    [`drop policy if exists "Users can view own subscription" on subscriptions`, `create policy "Users can view own subscription" on subscriptions for select using (auth.uid() = user_id)`],
    [`drop policy if exists "Host can manage own sessions" on sessions`, `create policy "Host can manage own sessions" on sessions for all using (auth.uid() = host_id)`],
    [`drop policy if exists "Anyone can read session by join_code" on sessions`, `create policy "Anyone can read session by join_code" on sessions for select using (true)`],
    [`drop policy if exists "Anyone can read teams" on teams`, `create policy "Anyone can read teams" on teams for select using (true)`],
    [`drop policy if exists "Host can manage teams" on teams`, `create policy "Host can manage teams" on teams for all using (auth.uid() = (select host_id from sessions where id = teams.session_id)) with check (auth.uid() = (select host_id from sessions where id = teams.session_id))`],
    [`drop policy if exists "Anyone can read players" on players`, `create policy "Anyone can read players" on players for select using (true)`],
    [`drop policy if exists "Anyone can insert player" on players`, `create policy "Anyone can insert player" on players for insert with check (true)`],
    [`drop policy if exists "Anyone can read categories" on categories`, `create policy "Anyone can read categories" on categories for select using (true)`],
    [`drop policy if exists "Anyone can read questions" on questions`, `create policy "Anyone can read questions" on questions for select using (true)`],
    [`drop policy if exists "Host can manage session_questions" on session_questions`, `create policy "Host can manage session_questions" on session_questions for all using (auth.uid() = (select host_id from sessions where id = session_questions.session_id)) with check (auth.uid() = (select host_id from sessions where id = session_questions.session_id))`],
    [`drop policy if exists "Anyone can read session_questions" on session_questions`, `create policy "Anyone can read session_questions" on session_questions for select using (true)`],
    [`drop policy if exists "Anyone can read session_categories" on session_categories`, `create policy "Anyone can read session_categories" on session_categories for select using (true)`],
    [`drop policy if exists "Host can manage session_categories" on session_categories`, `create policy "Host can manage session_categories" on session_categories for all using (auth.uid() = (select host_id from sessions where id = session_categories.session_id)) with check (auth.uid() = (select host_id from sessions where id = session_categories.session_id))`],
    [`drop policy if exists "Anyone can read scoring config" on scoring_config`, `create policy "Anyone can read scoring config" on scoring_config for select using (true)`],
    [`drop policy if exists "Users can view own payments" on payments`, `create policy "Users can view own payments" on payments for select using (auth.uid() = user_id)`],
  ]
  for (const [drop, create] of policies) {
    await client.query(drop)
    await client.query(create)
  }
  console.log('✅ Policies created')

  // --- TRIGGER ---
  console.log('\n⚡ Creating profile trigger...')
  await client.query(`
    create or replace function handle_new_user()
    returns trigger as $$
    begin
      insert into profiles (id, email)
      values (new.id, new.email)
      on conflict (id) do nothing;
      return new;
    end;
    $$ language plpgsql security definer;

    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure handle_new_user();
  `)
  console.log('✅ Trigger created')

  // --- SCORING CONFIG SEED ---
  await client.query(`
    insert into scoring_config (easy_points, medium_points, hard_points, default_timer_seconds)
    values (100, 200, 300, 30)
    on conflict do nothing;
  `)

  // --- CATEGORIES ---
  console.log('\n📚 Seeding categories...')
  await client.query(`
    insert into categories (id, name, icon) values
      ('cat-geo',   'جغرافيا',    '🌍'),
      ('cat-sci',   'علوم',       '🔬'),
      ('cat-hist',  'تاريخ',      '📜'),
      ('cat-sport', 'رياضة',      '⚽'),
      ('cat-art',   'فن وترفيه',  '🎬'),
      ('cat-gen',   'ثقافة عامة', '🧠')
    on conflict (id) do nothing;
  `)
  console.log('✅ 6 categories inserted')

  // --- QUESTIONS ---
  console.log('\n❓ Seeding questions...')
  await client.query(`
    insert into questions (category_id, difficulty, question, answer) values
    ('cat-geo','easy','ما هي عاصمة المملكة العربية السعودية؟','الرياض'),
    ('cat-geo','easy','ما هو أطول نهر في العالم؟','نهر النيل'),
    ('cat-geo','easy','في أي قارة تقع مصر؟','أفريقيا'),
    ('cat-geo','easy','ما هي عاصمة فرنسا؟','باريس'),
    ('cat-geo','medium','ما هي أكبر دولة في العالم من حيث المساحة؟','روسيا'),
    ('cat-geo','medium','كم عدد دول الخليج العربي؟','ست دول'),
    ('cat-geo','medium','ما هو أعمق بحيرة في العالم؟','بحيرة بايكال في روسيا'),
    ('cat-geo','hard','ما هو اسم المضيق الذي يفصل أوروبا عن أفريقيا؟','مضيق جبل طارق'),
    ('cat-geo','hard','ما هي عاصمة كازاخستان؟','أستانا'),
    ('cat-geo','hard','كم عدد دول أمريكا الجنوبية؟','12 دولة'),
    ('cat-sci','easy','ما هو الرمز الكيميائي للذهب؟','Au'),
    ('cat-sci','easy','ما هو أسرع حيوان بري في العالم؟','الفهد'),
    ('cat-sci','easy','كم عدد كواكب المجموعة الشمسية؟','8 كواكب'),
    ('cat-sci','easy','ما الذي يدور حول الأرض؟','القمر'),
    ('cat-sci','medium','ما هو العنصر الأكثر وفرة في الغلاف الجوي للأرض؟','النيتروجين'),
    ('cat-sci','medium','ما هي درجة غليان الماء بالمئوية؟','100 درجة مئوية'),
    ('cat-sci','medium','من اخترع المصباح الكهربائي؟','توماس إديسون'),
    ('cat-sci','hard','ما هي وحدة قياس الضغط الجوي؟','الباسكال أو الميليبار'),
    ('cat-sci','hard','ما هو العدد الذري للكربون؟','6'),
    ('cat-sci','hard','ما هي نظرية تفسر أصل الكون؟','نظرية الانفجار العظيم'),
    ('cat-hist','easy','من هو أول رئيس للولايات المتحدة الأمريكية؟','جورج واشنطن'),
    ('cat-hist','easy','في أي سنة بدأت الحرب العالمية الثانية؟','1939'),
    ('cat-hist','easy','من بنى الأهرامات؟','الفراعنة المصريون'),
    ('cat-hist','easy','ما هي الدولة التي أطلقت أول قمر صناعي؟','الاتحاد السوفيتي'),
    ('cat-hist','medium','متى فتحت مدينة القسطنطينية؟','1453م'),
    ('cat-hist','medium','من هو مؤسس الدولة العثمانية؟','عثمان الأول'),
    ('cat-hist','medium','في أي عام وصل كريستوفر كولومبوس إلى أمريكا؟','1492م'),
    ('cat-hist','hard','ما هي معاهدة السلام التي أنهت الحرب العالمية الأولى؟','معاهدة فرساي'),
    ('cat-hist','hard','من كتب كتاب فن الحرب؟','سون تزو'),
    ('cat-hist','hard','ما هو اسم الخليفة الأول للمسلمين بعد النبي محمد؟','أبو بكر الصديق'),
    ('cat-sport','easy','كم عدد لاعبي كرة القدم في كل فريق؟','11 لاعبا'),
    ('cat-sport','easy','في أي دولة أقيمت كأس العالم 2022؟','قطر'),
    ('cat-sport','easy','كم مرة يقام الأولمبياد الصيفي؟','كل 4 سنوات'),
    ('cat-sport','easy','من هو الرياضي الأكثر حصولا على ألقاب كرة القدم حتى 2024؟','ليونيل ميسي'),
    ('cat-sport','medium','كم مدة مباراة كرة القدم الرسمية؟','90 دقيقة'),
    ('cat-sport','medium','من هو الرياضي الأكثر حصولا على ميداليات أولمبية في التاريخ؟','مايكل فيلبس'),
    ('cat-sport','hard','كم عدد بطولات غراند سلام في التنس؟','4 بطولات'),
    ('cat-sport','hard','من فاز بكأس العالم لكرة القدم أكثر مرة؟','البرازيل 5 مرات'),
    ('cat-art','easy','من رسم لوحة الموناليزا؟','ليوناردو دافنشي'),
    ('cat-art','easy','في أي بلد تقع هوليوود؟','الولايات المتحدة الأمريكية'),
    ('cat-art','easy','ما اسم بطل فيلم The Lion King؟','سيمبا'),
    ('cat-art','medium','من كتب رواية هاري بوتر؟','جوان رولينغ'),
    ('cat-art','medium','ما هو أكثر الأفلام إيرادا في تاريخ السينما؟','Avatar 2009'),
    ('cat-art','hard','من ألف سيمفونية رقم 9؟','لودفيغ فان بيتهوفن'),
    ('cat-art','hard','في أي عام أسست شركة والت ديزني؟','1923'),
    ('cat-gen','easy','ما هو أكبر كوكب في المجموعة الشمسية؟','المشتري'),
    ('cat-gen','easy','كم عدد الألوان في قوس قزح؟','7 ألوان'),
    ('cat-gen','easy','كم يساوي 7 في 8؟','56'),
    ('cat-gen','medium','ما هو أغلى معدن في العالم؟','الروديوم'),
    ('cat-gen','medium','ما هو المحيط الأكبر في العالم؟','المحيط الهادئ'),
    ('cat-gen','medium','كم عدد الأسنان الدائمة لدى الإنسان البالغ؟','32 سنة'),
    ('cat-gen','hard','ما هو أصغر عظمة في جسم الإنسان؟','الركابة في الأذن'),
    ('cat-gen','hard','ما هو الرقم الياباني الذي يلفظ مثل الموت؟','الرقم 4')
    on conflict do nothing;
  `)
  console.log('✅ 52 questions inserted')

  // --- BACKFILL EXISTING USERS INTO PROFILES ---
  console.log('\n👤 Backfilling existing users into profiles...')
  await client.query(`
    insert into profiles (id, email, role)
    select id, email, 'admin'
    from auth.users
    on conflict (id) do update set role = 'admin';
  `)
  console.log('✅ All existing users added to profiles with admin role')

  await client.end()
  console.log('\n🎉 Migration complete! Your database is ready.')
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
})
