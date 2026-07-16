-- ALTER TABLE courses to support course type categorisation
ALTER TABLE courses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'theory' CHECK (type IN ('theory', 'sessional'));
