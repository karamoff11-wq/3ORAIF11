-- ─────────────────────────────────────────────
-- app_settings: one row per section, value = JSON blob
-- Architecture: key = section name, value = full settings object
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Seed Phase 1 defaults
INSERT INTO app_settings (key, value) VALUES
  ('appearance', '{
    "primary_color":   "#7c3aed",
    "accent_color":    "#f59e0b",
    "bg_color":        "#04040f",
    "font_body":       "Cairo",
    "particles_enabled": true,
    "grid_enabled":    true,
    "noise_enabled":   true
  }'),
  ('landing', '{
    "hero_title_ar":    "أبو العُريف",
    "hero_title_en":    "Abu Al-Areef",
    "hero_subtitle_ar": "منصة المسابقات الأولى عربياً",
    "hero_subtitle_en": "The #1 Arabic Trivia Platform",
    "cta_label_ar":     "ابدأ اللعب",
    "cta_label_en":     "Start Playing",
    "show_quiz_demo":   true,
    "show_orbs":        true,
    "social_facebook":  "#",
    "social_youtube":   "#",
    "social_instagram": "#",
    "social_twitter":   "#"
  }'),
  ('game', '{
    "max_categories":       12,
    "fireworks_enabled":    true,
    "particles_enabled":    true,
    "answer_reveal_delay":  1200,
    "start_label_ar":       "ابدأ اللعبة",
    "start_label_en":       "Start Game",
    "correct_label_ar":     "صحيح!",
    "correct_label_en":     "Correct!",
    "wrong_label_ar":       "خطأ!",
    "wrong_label_en":       "Wrong!",
    "next_label_ar":        "التالي",
    "next_label_en":        "Next",
    "timer_visible":        true,
    "scoreboard_visible":   true
  }')
ON CONFLICT (key) DO NOTHING;
