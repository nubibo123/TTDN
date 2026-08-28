CREATE TABLE IF NOT EXISTS saved_universities (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    university_id VARCHAR(36) NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_saved_universities_student_university UNIQUE (student_id, university_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_universities_student ON saved_universities(student_id);
