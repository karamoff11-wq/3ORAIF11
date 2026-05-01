-- =============================================
-- Migration: Add video_url to topics
-- Run this in Supabase SQL Editor
-- =============================================

ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS video_url text;
