-- Add glow settings to scoring_config
ALTER TABLE scoring_config
ADD COLUMN IF NOT EXISTS glow_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS glow_intensity int DEFAULT 40,
ADD COLUMN IF NOT EXISTS flash_start_seconds int DEFAULT 15;

-- Update existing rows
UPDATE scoring_config 
SET glow_enabled = true, glow_intensity = 40, flash_start_seconds = 15 
WHERE glow_enabled IS NULL;
