-- Create admin_profiles table to store CR batch scoping metadata
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  level TEXT NOT NULL DEFAULT '1',
  term TEXT NOT NULL DEFAULT 'I',
  section TEXT NOT NULL DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for admin_profiles" ON admin_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow individual updates for admin_profiles" ON admin_profiles
  FOR ALL TO authenticated USING (true);

-- Add section to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';

-- Add level, term, section to routine
ALTER TABLE routine ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '1';
ALTER TABLE routine ADD COLUMN IF NOT EXISTS term TEXT DEFAULT 'I';
ALTER TABLE routine ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';

-- Add level, term, section to deadlines
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '1';
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS term TEXT DEFAULT 'I';
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';

-- Add level, term, section to notices
ALTER TABLE notices ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '1';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS term TEXT DEFAULT 'I';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';
