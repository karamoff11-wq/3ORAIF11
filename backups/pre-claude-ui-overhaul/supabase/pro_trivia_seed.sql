-- =============================================
-- FULL PRO TRIVIA DATABASE SEED
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

-- 4. INSERT ALL 64 CATEGORIES
INSERT INTO categories (id, topic_id, name, icon) VALUES
  -- 1. GEOGRAPHY (4)
  ('cat-geo-capitals', 'topic-geography', 'عواصم', '🏛️'),
  ('cat-geo-flags', 'topic-geography', 'أعلام', '🎌'),
  ('cat-geo-countries', 'topic-geography', 'دول', '🌍'),
  ('cat-geo-borders', 'topic-geography', 'حدود الدول', '🗺️'),

  -- 2. SCIENCE (4)
  ('cat-sci-chemistry', 'topic-science', 'كيمياء', '🧪'),
  ('cat-sci-physics', 'topic-science', 'فيزياء', '⚡'),
  ('cat-sci-math', 'topic-science', 'رياضيات', '➗'),
  ('cat-sci-biology', 'topic-science', 'أحياء', '🧬'),

  -- 3. WHO_AM_I (4)
  ('cat-who-actor', 'topic-whoami', 'ممثلون', '🎭'),
  ('cat-who-country', 'topic-whoami', 'دول', '🌍'),
  ('cat-who-singer', 'topic-whoami', 'مغنون', '🎤'),
  ('cat-who-pop', 'topic-whoami', 'مشاهير معاصرون', '🌟'),

  -- 4. ECONOMY (4)
  ('cat-eco-currencies', 'topic-economy', 'عملات', '💰'),
  ('cat-eco-gdp', 'topic-economy', 'الناتج المحلي', '📊'),
  ('cat-eco-companies', 'topic-economy', 'شركات', '🏢'),
  ('cat-eco-trade', 'topic-economy', 'صادرات وتجارة', '🚢'),

  -- 5. FOOTBALL (4)
  ('cat-foot-stadiums', 'topic-football', 'ملاعب', '🏟️'),
  ('cat-foot-careers', 'topic-football', 'مسيرات اللاعبين', '🏃'),
  ('cat-foot-guess-team', 'topic-football', 'خمن الفريق', '👕'),
  ('cat-foot-old-logos', 'topic-football', 'شعارات قديمة', '🛡️'),

  -- 6. GENERAL (4)
  ('cat-gen-knowledge', 'topic-general', 'معلومات عامة', '🧠'),
  ('cat-gen-food', 'topic-general', 'طعام', '🍕'),
  ('cat-gen-logos', 'topic-general', 'شعارات', '🏷️'),
  ('cat-gen-art', 'topic-general', 'فنون', '🎨'),

  -- 7. MOVIES (10)
  ('cat-mov-titanic', 'topic-movies', 'Titanic', '🚢'),
  ('cat-mov-inception', 'topic-movies', 'Inception', '🌀'),
  ('cat-mov-dark-knight', 'topic-movies', 'The Dark Knight', '🦇'),
  ('cat-mov-avatar', 'topic-movies', 'Avatar', '🌲'),
  ('cat-mov-matrix', 'topic-movies', 'The Matrix', '💊'),
  ('cat-mov-avengers', 'topic-movies', 'Avengers', '🦸'),
  ('cat-mov-godfather', 'topic-movies', 'The Godfather', '🔫'),
  ('cat-mov-harry-potter', 'topic-movies', 'Harry Potter', '⚡'),
  ('cat-mov-interstellar', 'topic-movies', 'Interstellar', '🌌'),
  ('cat-mov-lotr', 'topic-movies', 'Lord of the Rings', '💍'),

  -- 8. TV_SHOWS (10)
  ('cat-tv-breaking-bad', 'topic-tvshows', 'Breaking Bad', '⚗️'),
  ('cat-tv-office', 'topic-tvshows', 'The Office', '🏢'),
  ('cat-tv-got', 'topic-tvshows', 'Game of Thrones', '⚔️'),
  ('cat-tv-friends', 'topic-tvshows', 'Friends', '☕'),
  ('cat-tv-stranger', 'topic-tvshows', 'Stranger Things', '🚲'),
  ('cat-tv-peaky', 'topic-tvshows', 'Peaky Blinders', '🧢'),
  ('cat-tv-prison', 'topic-tvshows', 'Prison Break', '⛓️'),
  ('cat-tv-money', 'topic-tvshows', 'Money Heist', '🎭'),
  ('cat-tv-dark', 'topic-tvshows', 'Dark', '⏳'),
  ('cat-tv-sherlock', 'topic-tvshows', 'Sherlock', '🔎'),

  -- 9. ANIME (10)
  ('cat-ani-aot', 'topic-anime', 'Attack on Titan', '⚔️'),
  ('cat-ani-naruto', 'topic-anime', 'Naruto', '🦊'),
  ('cat-ani-one-piece', 'topic-anime', 'One Piece', '🏴‍☠️'),
  ('cat-ani-death-note', 'topic-anime', 'Death Note', '📓'),
  ('cat-ani-hunter', 'topic-anime', 'Hunter x Hunter', '🎣'),
  ('cat-ani-dbz', 'topic-anime', 'Dragon Ball Z', '🐉'),
  ('cat-ani-demon', 'topic-anime', 'Demon Slayer', '🗡️'),
  ('cat-ani-jujutsu', 'topic-anime', 'Jujutsu Kaisen', '🤞'),
  ('cat-ani-fmab', 'topic-anime', 'Fullmetal Alchemist', '🦾'),
  ('cat-ani-bleach', 'topic-anime', 'Bleach', '👻'),

  -- 10. VIDEO_GAMES (10)
  ('cat-game-gta5', 'topic-videogames', 'GTA V', '🚗'),
  ('cat-game-fifa', 'topic-videogames', 'FIFA', '⚽'),
  ('cat-game-minecraft', 'topic-videogames', 'Minecraft', '🧱'),
  ('cat-game-witcher', 'topic-videogames', 'The Witcher 3', '🐺'),
  ('cat-game-rdr2', 'topic-videogames', 'Red Dead Redemption 2', '🤠'),
  ('cat-game-cod', 'topic-videogames', 'Call of Duty', '🔫'),
  ('cat-game-csgo', 'topic-videogames', 'CS:GO', '💣'),
  ('cat-game-lol', 'topic-videogames', 'League of Legends', '🏆'),
  ('cat-game-zelda', 'topic-videogames', 'Zelda: BOTW', '🧝'),
  ('cat-game-gow', 'topic-videogames', 'God of War', '🪓');

-- 5. INSERT INITIAL QUESTIONS
INSERT INTO questions (category_id, difficulty, question, answer) VALUES
  ('cat-gen-knowledge', 'easy', 'ما هو الحيوان الذي يُعرف بأنه الأسرع على وجه الأرض؟', 'الفهد'),
  ('cat-mov-dark-knight', 'easy', 'ما هو اسم الممثل الذي أدى شخصية الجوكر؟', 'هيث ليدجر'),
  ('cat-ani-aot', 'easy', 'ما هو اسم البطل الرئيسي الذي يسعى لإبادة العمالقة؟', 'إيرين ييغر'),
  ('cat-game-gta5', 'easy', 'ما هي أسماء الشخصيات الثلاثة القابلة للعب؟', 'مايكل، تريفور، فرانكلين'),
  ('cat-foot-careers', 'medium', 'لعب لأندية: بازل، تشيلسي، فيورنتينا، روما، ليفربول. من هو؟', 'محمد صلاح'),
  ('cat-eco-companies', 'easy', 'الشركة التي أسسها ستيف جوبز في مرآب عام 1976؟', 'أبل (Apple)');
