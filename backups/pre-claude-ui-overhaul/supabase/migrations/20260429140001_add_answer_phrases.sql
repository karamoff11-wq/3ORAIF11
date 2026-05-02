-- Create answer_phrases table
CREATE TABLE IF NOT EXISTS answer_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('correct', 'wrong', 'punishment')),
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some default phrases
INSERT INTO answer_phrases (category, text) VALUES
  ('correct', 'ممتاز! إجابة صحيحة! 🎉'),
  ('correct', 'أحسنت! عبقري! 🧠'),
  ('correct', 'صح صح صح! 👏'),
  ('correct', 'يا سلام عليك!'),
  ('correct', 'هذا هو الجواب! 💯'),
  ('wrong', 'للأسف... ليست هذه الإجابة ❌'),
  ('wrong', 'حاول مرة أخرى! المرة القادمة ستنجح'),
  ('wrong', 'لا يا صاحبي... غلط!'),
  ('wrong', 'اوه! للأسف الإجابة خاطئة'),
  ('wrong', 'تقريباً... ولكن لا! ❌');
