-- =============================================
-- THE FINAL DATABASE SEED
-- =============================================

-- 1. CLEAR OLD DATA (Proceed with caution)
TRUNCATE TABLE questions CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE topics CASCADE;

-- 2. ENSURE TABLES EXIST
CREATE TABLE IF NOT EXISTS topics (
  id text primary key,
  name text not null,
  icon text,
  color text,
  order_index int default 0,
  created_at timestamp with time zone default now()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='topic_id') THEN
    ALTER TABLE categories ADD COLUMN topic_id text REFERENCES topics(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. INSERT TOPICS
INSERT INTO topics (id, name, icon, color, order_index) VALUES
  ('topic-geography', 'جغرافيا', '🌍', '#10b981', 1),
  ('topic-science', 'علوم', '🔬', '#3b82f6', 2),
  ('topic-whoami', 'من أنا', '👤', '#8b5cf6', 3),
  ('topic-economy', 'اقتصاد', '📈', '#eab308', 4),
  ('topic-football', 'كرة قدم', '⚽', '#22c55e', 5),
  ('topic-general', 'عامة', '💡', '#f97316', 6),
  ('topic-movies', 'أفلام', '🎬', '#ef4444', 7),
  ('topic-tvshows', 'مسلسلات', '📺', '#ec4899', 8),
  ('topic-anime', 'أنمي', '🎌', '#f43f5e', 9),
  ('topic-videogames', 'ألعاب فيديو', '🎮', '#84cc16', 10);

-- 4. INSERT EXACT CATEGORIES (As Requested)
INSERT INTO categories (id, topic_id, name, icon) VALUES
  -- GEOGRAPHY
  ('cat-capitals', 'topic-geography', 'عواصم', '🏛️'),
  ('cat-borders', 'topic-geography', 'حدود الدول', '🗺️'),
  ('cat-countries', 'topic-geography', 'دول', '🌍'),
  ('cat-flags', 'topic-geography', 'أعلام', '🎌'),

  -- SCIENCE
  ('cat-chemistry', 'topic-science', 'كيمياء', '🧪'),
  ('cat-physics', 'topic-science', 'فيزياء', '⚡'),
  ('cat-math', 'topic-science', 'رياضيات', '➗'),
  ('cat-biology', 'topic-science', 'أحياء', '🧬'),

  -- WHO AM I
  ('cat-who-current', 'topic-whoami', 'من أنا (معاصرون)', '👤'),
  ('cat-who-country', 'topic-whoami', 'من أنا (دول)', '🌍'),
  ('cat-who-actor', 'topic-whoami', 'من أنا (ممثلون)', '🎭'),
  ('cat-who-singer', 'topic-whoami', 'من أنا (مغنون)', '🎤'),

  -- ECONOMY
  ('cat-currencies', 'topic-economy', 'عملات', '💰'),
  ('cat-gdp', 'topic-economy', 'الناتج المحلي', '📊'),
  ('cat-companies', 'topic-economy', 'شركات', '🏢'),
  ('cat-trade', 'topic-economy', 'صادرات وتجارة', '🚢'),

  -- FOOTBALL
  ('cat-stadiums', 'topic-football', 'ملاعب', '🏟️'),
  ('cat-careers', 'topic-football', 'مسيرات اللاعبين', '🏃'),
  ('cat-guess-team', 'topic-football', 'خمن الفريق', '👕'),
  ('cat-logos', 'topic-football', 'شعارات قديمة', '🛡️'),

  -- GENERAL
  ('cat-general-know', 'topic-general', 'معلومات عامة', '🧠'),
  ('cat-food', 'topic-general', 'طعام', '🍕'),
  ('cat-art', 'topic-general', 'فنون', '🎨'),
  ('cat-history', 'topic-general', 'تاريخ', '📜'),

  -- MOVIES
  ('cat-movie-titanic', 'topic-movies', 'Titanic', '🚢'),
  ('cat-movie-inception', 'topic-movies', 'Inception', '🌀'),
  ('cat-movie-dark-knight', 'topic-movies', 'The Dark Knight', '🦇'),
  ('cat-movie-avatar', 'topic-movies', 'Avatar', '🌲'),
  ('cat-movie-matrix', 'topic-movies', 'The Matrix', '💊'),
  ('cat-movie-avengers', 'topic-movies', 'Avengers', '🦸'),
  ('cat-movie-godfather', 'topic-movies', 'The Godfather', '🔫'),
  ('cat-movie-harry-potter', 'topic-movies', 'Harry Potter', '⚡'),
  ('cat-movie-interstellar', 'topic-movies', 'Interstellar', '🌌'),
  ('cat-movie-lotr', 'topic-movies', 'Lord of the Rings', '💍'),

  -- TV SHOWS
  ('cat-tv-breaking-bad', 'topic-tvshows', 'Breaking Bad', '⚗️'),
  ('cat-tv-got', 'topic-tvshows', 'Game of Thrones', '⚔️'),
  ('cat-tv-office', 'topic-tvshows', 'The Office', '🏢'),
  ('cat-tv-friends', 'topic-tvshows', 'Friends', '☕'),
  ('cat-tv-stranger-things', 'topic-tvshows', 'Stranger Things', '🚲'),
  ('cat-tv-peaky-blinders', 'topic-tvshows', 'Peaky Blinders', '🧢'),
  ('cat-tv-prison-break', 'topic-tvshows', 'Prison Break', '⛓️'),
  ('cat-tv-money-heist', 'topic-tvshows', 'Money Heist', '🎭'),
  ('cat-tv-dark', 'topic-tvshows', 'Dark', '⏳'),
  ('cat-tv-sherlock', 'topic-tvshows', 'Sherlock', '🔎'),

  -- ANIME
  ('cat-anime-aot', 'topic-anime', 'Attack on Titan', '⚔️'),
  ('cat-anime-naruto', 'topic-anime', 'Naruto', '🦊'),
  ('cat-anime-one-piece', 'topic-anime', 'One Piece', '🏴‍☠️'),
  ('cat-anime-death-note', 'topic-anime', 'Death Note', '📓'),
  ('cat-anime-hunter', 'topic-anime', 'Hunter x Hunter', '🎣'),
  ('cat-anime-dbz', 'topic-anime', 'Dragon Ball Z', '🐉'),
  ('cat-anime-demon-slayer', 'topic-anime', 'Demon Slayer', '🗡️'),
  ('cat-anime-jujutsu', 'topic-anime', 'Jujutsu Kaisen', '🤞'),
  ('cat-anime-fmab', 'topic-anime', 'Fullmetal Alchemist', '🦾'),
  ('cat-anime-bleach', 'topic-anime', 'Bleach', '👻'),

  -- VIDEO GAMES
  ('cat-game-gta', 'topic-videogames', 'GTA V', '🚗'),
  ('cat-game-fifa', 'topic-videogames', 'FIFA', '⚽'),
  ('cat-game-minecraft', 'topic-videogames', 'Minecraft', '🧱'),
  ('cat-game-witcher', 'topic-videogames', 'The Witcher 3', '🐺'),
  ('cat-game-rdr2', 'topic-videogames', 'Red Dead Redemption 2', '🤠'),
  ('cat-game-cod', 'topic-videogames', 'Call of Duty', '🔫'),
  ('cat-game-csgo', 'topic-videogames', 'CS:GO', '💣'),
  ('cat-game-league', 'topic-videogames', 'League of Legends', '🏆'),
  ('cat-game-zelda', 'topic-videogames', 'Zelda: BOTW', '🧝'),
  ('cat-game-godofwar', 'topic-videogames', 'God of War', '🪓');

-- 5. INSERT INITIAL QUESTIONS
INSERT INTO questions (category_id, difficulty, question, answer) VALUES
  ('cat-general-know', 'easy', 'ما هو الحيوان الذي يُعرف بأنه الأسرع على وجه الأرض؟', 'الفهد'),
  ('cat-movie-dark-knight', 'easy', 'ما هو اسم الممثل الذي أدى شخصية الجوكر؟', 'هيث ليدجر'),
  ('cat-anime-aot', 'easy', 'ما هو اسم البطل الرئيسي الذي يسعى لإبادة العمالقة؟', 'إيرين ييغر'),
  ('cat-game-gta', 'easy', 'ما هي أسماء الشخصيات الثلاثة القابلة للعب؟', 'مايكل، تريفور، فرانكلين'),
  ('cat-careers', 'medium', 'لعب لأندية: بازل، تشيلسي، فيورنتينا، روما، ليفربول. من هو؟', 'محمد صلاح'),
  ('cat-companies', 'easy', 'الشركة التي أسسها ستيف جوبز في مرآب عام 1976؟', 'أبل (Apple)');
