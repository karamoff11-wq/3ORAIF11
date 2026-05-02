-- =============================================
-- Custom Mascots & Audio Schema Update
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create the mascots table
CREATE TABLE IF NOT EXISTS mascots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  idle_url text,
  correct_url text,
  wrong_url text,
  punishment_url text,
  thinking_url text,
  hype_url text,
  angry_url text,
  intro_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on mascots
ALTER TABLE mascots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mascots" ON mascots FOR SELECT USING (true);
CREATE POLICY "Admins can manage mascots" ON mascots FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. Link mascot_settings to the new mascots table
ALTER TABLE mascot_settings ADD COLUMN IF NOT EXISTS active_mascot_id uuid REFERENCES mascots(id);

-- 3. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('mascots', 'mascots', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true) ON CONFLICT DO NOTHING;

-- 4. Set up Storage RLS for mascots bucket
CREATE POLICY "Public Access for mascots" ON storage.objects FOR SELECT USING (bucket_id = 'mascots');
CREATE POLICY "Allow Uploads for mascots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mascots');
CREATE POLICY "Allow Updates for mascots" ON storage.objects FOR UPDATE USING (bucket_id = 'mascots');

-- 5. Set up Storage RLS for audio bucket
CREATE POLICY "Public Access for audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "Allow Uploads for audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio');
CREATE POLICY "Allow Updates for audio" ON storage.objects FOR UPDATE USING (bucket_id = 'audio');
