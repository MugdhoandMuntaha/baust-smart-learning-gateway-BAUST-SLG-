-- Migration to support nested Folders inside Folders
ALTER TABLE Folders ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES Folders(id) ON DELETE CASCADE;

-- Drop old name-course_id uniqueness since name only needs to be unique per parent folder level
ALTER TABLE Folders DROP CONSTRAINT IF EXISTS Folders_name_course_id_key;

-- Re-create unique indexes for parent folders and root level
CREATE UNIQUE INDEX IF NOT EXISTS Folders_name_course_id_parent_null_idx ON Folders (name, course_id) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS Folders_name_parent_id_idx ON Folders (name, parent_id) WHERE parent_id IS NOT NULL;
