-- V2: Add new columns to universities table for detailed school info
ALTER TABLE universities ALTER COLUMN tuition_range TYPE TEXT;

ALTER TABLE universities ADD COLUMN IF NOT EXISTS dean_url TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);