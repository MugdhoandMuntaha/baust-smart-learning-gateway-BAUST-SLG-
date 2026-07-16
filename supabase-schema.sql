-- =====================================================
-- CR Portal - Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: notices
-- =====================================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exam', 'class_cancelled', 'assignment', 'urgent', 'general')),
  is_pinned BOOLEAN DEFAULT false,
  level TEXT DEFAULT '1',
  term TEXT DEFAULT 'I',
  section TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: routine
-- =====================================================
CREATE TABLE IF NOT EXISTS routine (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL CHECK (day IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  course_code TEXT NOT NULL,
  course_title TEXT NOT NULL,
  teacher_initials TEXT NOT NULL,
  room_number TEXT NOT NULL,
  level TEXT DEFAULT '1',
  term TEXT DEFAULT 'I',
  section TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: deadlines
-- =====================================================
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('assignment', 'quiz', 'lab_report', 'project')),
  due_date TIMESTAMPTZ NOT NULL,
  level TEXT DEFAULT '1',
  term TEXT DEFAULT 'I',
  section TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: documents (metadata only, files in Storage)
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  course_name TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ for all tables (viewers can read)
CREATE POLICY "Public read access for notices" ON notices
  FOR SELECT USING (true);

CREATE POLICY "Public read access for routine" ON routine
  FOR SELECT USING (true);

CREATE POLICY "Public read access for deadlines" ON deadlines
  FOR SELECT USING (true);

CREATE POLICY "Public read access for documents" ON documents
  FOR SELECT USING (true);

-- AUTHENTICATED WRITE for all tables (admin only)
CREATE POLICY "Authenticated insert for notices" ON notices
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update for notices" ON notices
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete for notices" ON notices
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated insert for routine" ON routine
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update for routine" ON routine
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete for routine" ON routine
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated insert for deadlines" ON deadlines
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update for deadlines" ON deadlines
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete for deadlines" ON deadlines
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated insert for documents" ON documents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update for documents" ON documents
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete for documents" ON documents
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Table: courses
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  teacher_name TEXT,
  teacher_designation TEXT,
  teacher_avatar_url TEXT,
  level TEXT DEFAULT '1',
  term TEXT DEFAULT 'I',
  section TEXT DEFAULT 'A',
  type TEXT DEFAULT 'theory' CHECK (type IN ('theory', 'sessional')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert for courses" ON courses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update for courses" ON courses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete for courses" ON courses
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Storage Bucket
-- =====================================================
-- NOTE: Create a "documents" bucket in Supabase Dashboard
-- Settings > Storage > Create new bucket
-- Name: documents
-- Public: Yes (for download links)
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.*, image/*

-- SQL to automatically initialize bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies:
CREATE POLICY "Public Read Access for Documents Bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Authenticated Upload for Documents Bucket" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND name LIKE 'avatars/%');

CREATE POLICY "Authenticated Update for Documents Bucket" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'documents');

CREATE POLICY "Authenticated Delete for Documents Bucket" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- =====================================================
-- Table: portal_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS portal_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings',
  university_name TEXT DEFAULT 'Bangladesh Army University of Science & Technology',
  department_name TEXT DEFAULT 'CSE',
  section_name TEXT DEFAULT 'Section A',
  batch_no TEXT DEFAULT 'Batch 19',
  batch_advisor TEXT DEFAULT 'Md. Zahim Hassan',
  dpc_name TEXT DEFAULT 'Md. Zahim Hassan',
  dpc_phone TEXT DEFAULT '01736393334',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-populate the settings row
INSERT INTO portal_settings (id, university_name, department_name, section_name, batch_no, batch_advisor, dpc_name, dpc_phone)
VALUES ('settings', 'Bangladesh Army University of Science & Technology', 'CSE', 'Section A', 'Batch 19', 'Md. Zahim Hassan', 'Md. Zahim Hassan', '01736393334')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for portal_settings" ON portal_settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write for portal_settings" ON portal_settings
  FOR ALL TO authenticated USING (true);

-- =====================================================
-- Table: student_profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  level TEXT DEFAULT '1',
  term TEXT DEFAULT 'I',
  avatar_url TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for student_profiles
CREATE POLICY "Public profiles are viewable by everyone" ON student_profiles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert profiles referenced to auth users" ON student_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON student_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can do everything on student_profiles" ON student_profiles
  FOR ALL TO authenticated USING (true);

-- =====================================================
-- Table: subfolders
-- =====================================================
CREATE TABLE IF NOT EXISTS subfolders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, course_id)
);

-- Enable RLS
ALTER TABLE subfolders ENABLE ROW LEVEL SECURITY;

-- Policies for subfolders
CREATE POLICY "Public subfolders read access" ON subfolders
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert subfolders" ON subfolders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update subfolders" ON subfolders
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete subfolders" ON subfolders
  FOR DELETE TO authenticated USING (true);

-- Add subfolder_id to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS subfolder_id UUID REFERENCES subfolders(id) ON DELETE CASCADE;

-- =====================================================
-- Table: generator_templates
-- Admin-managed lab report / assignment templates
-- =====================================================
CREATE TABLE IF NOT EXISTS generator_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('lab_report', 'assignment')),
  title TEXT NOT NULL,          -- experiment name / assignment topic
  no TEXT NOT NULL,             -- experiment no / assignment no
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

-- =====================================================
-- Table: teachers
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

-- =====================================================
-- Table: admin_profiles
-- =====================================================
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

