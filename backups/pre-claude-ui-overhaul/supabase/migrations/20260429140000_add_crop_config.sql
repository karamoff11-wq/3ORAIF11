-- Add crop_config JSONB column to categories (for images)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS crop_config JSONB DEFAULT NULL;

-- Add crop_config JSONB column to topics (for videos)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS crop_config JSONB DEFAULT NULL;
