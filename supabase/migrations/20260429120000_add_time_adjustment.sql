-- Add time_adjustment_seconds to scoring_config
ALTER TABLE scoring_config
ADD COLUMN IF NOT EXISTS time_adjustment_seconds int DEFAULT 5;

-- Update the view or existing rows if needed
UPDATE scoring_config SET time_adjustment_seconds = 5 WHERE time_adjustment_seconds IS NULL;
