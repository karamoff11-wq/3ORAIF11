-- =============================================
-- FIX: Auto-generate IDs for categories and topics if missing
-- =============================================

-- 1. Ensure categories table has a default ID (UUID cast to text)
ALTER TABLE categories ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 2. Ensure topics table has a default ID (UUID cast to text)
ALTER TABLE topics ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 3. (Optional) If questions has the same issue
ALTER TABLE questions ALTER COLUMN id SET DEFAULT gen_random_uuid();
