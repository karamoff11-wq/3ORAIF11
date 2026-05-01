-- Add bg_style column to topics for solid/gradient backgrounds
ALTER TABLE topics ADD COLUMN IF NOT EXISTS bg_style TEXT DEFAULT 'bg-gradient-to-br from-gray-900 to-black';
