-- ==========================================================
-- Migration: Auto Confirm Signup Emails & Add Username Column
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ==========================================================

-- 1. Add username column to student_profiles table
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Create function to automatically confirm auth user emails upon insert
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop trigger if it already exists, then create it
DROP TRIGGER IF EXISTS tr_auto_confirm_email ON auth.users;

CREATE TRIGGER tr_auto_confirm_email
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();
