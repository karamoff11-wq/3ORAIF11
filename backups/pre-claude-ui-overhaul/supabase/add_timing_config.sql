-- Add timing_config to mascot_settings
ALTER TABLE mascot_settings
ADD COLUMN IF NOT EXISTS timing_config JSONB DEFAULT '{"correct": 350, "wrong": 250, "reveal": 400, "voice_lang": "ar-SA"}'::jsonb;
