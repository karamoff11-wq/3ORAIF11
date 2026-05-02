-- =============================================
-- Add image_url to categories
-- =============================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for images bucket
CREATE POLICY "Public Access for images" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'images' );

CREATE POLICY "Allow Uploads for images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'images' );

-- Add hide_icon to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS hide_icon BOOLEAN DEFAULT false;
