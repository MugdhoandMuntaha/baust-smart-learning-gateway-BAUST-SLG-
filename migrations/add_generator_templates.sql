-- =====================================================
-- Migration: Add generator_templates table
-- Run this in your Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS generator_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('lab_report', 'assignment')),
  title TEXT NOT NULL,
  no TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  experiment_date DATE,
  submission_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE generator_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for generator_templates" ON generator_templates
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert for generator_templates" ON generator_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update for generator_templates" ON generator_templates
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete for generator_templates" ON generator_templates
  FOR DELETE TO authenticated USING (true);
