CREATE TABLE IF NOT EXISTS student_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    graduation_year INTEGER,
    province VARCHAR(100),
    is_profile_public BOOLEAN NOT NULL DEFAULT FALSE,
    show_grades BOOLEAN NOT NULL DEFAULT FALSE,
    allow_contact BOOLEAN NOT NULL DEFAULT TRUE,
    show_in_forum BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
