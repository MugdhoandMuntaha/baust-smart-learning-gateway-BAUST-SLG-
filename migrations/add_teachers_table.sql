-- =====================================================
-- Migration: Add teachers table
-- Run this in your Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  phone_number TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for teachers" ON teachers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert for teachers" ON teachers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update for teachers" ON teachers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete for teachers" ON teachers
  FOR DELETE TO authenticated USING (true);
