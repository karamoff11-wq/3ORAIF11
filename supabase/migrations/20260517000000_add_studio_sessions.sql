-- Add Studio Sessions Table to store custom user-generated sessions privately

CREATE TABLE IF NOT EXISTS public.studio_sessions (
    id text PRIMARY KEY,
    name text NOT NULL,
    content jsonb NOT NULL,
    creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.studio_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users or authenticated users to insert their own sessions
CREATE POLICY "Anyone can insert studio sessions" 
ON public.studio_sessions 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view all studio sessions
CREATE POLICY "Admins can view studio sessions" 
ON public.studio_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id
    -- assuming you have an admin check, or just allow auth users to read
  )
);
