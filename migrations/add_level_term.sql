-- =====================================================
-- Migration: Add level and term to courses table
-- Run this in your Supabase SQL Editor
-- =====================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '1';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS term TEXT DEFAULT 'I';
