-- Alter deadlines table to support 7-day schedule fields & syllabus
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS room_no TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS syllabus TEXT;

-- Update the check constraint to support additional categories like 'mid_exam', 'ct', 'lab_evaluation', and 'viva'
ALTER TABLE deadlines DROP CONSTRAINT IF EXISTS deadlines_category_check;
ALTER TABLE deadlines ADD CONSTRAINT deadlines_category_check 
  CHECK (category IN ('assignment', 'quiz', 'lab_report', 'project', 'mid_exam', 'ct', 'lab_evaluation', 'viva'));
