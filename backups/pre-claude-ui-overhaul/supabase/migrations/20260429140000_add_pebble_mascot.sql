-- Add pebble mascot preview color to mascot_settings
ALTER TABLE mascot_settings
  ADD COLUMN IF NOT EXISTS pebble_preview_color TEXT DEFAULT '#6B9FD4';
