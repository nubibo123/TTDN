CREATE TABLE IF NOT EXISTS consultations (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id),
    advisor_id VARCHAR(36) REFERENCES advisors(id),
    topic VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    mode VARCHAR(32) NOT NULL DEFAULT 'CHAT',
    scheduled_time VARCHAR(255),
    contact_phone VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS consultations ADD COLUMN IF NOT EXISTS mode VARCHAR(32) NOT NULL DEFAULT 'CHAT';
ALTER TABLE IF EXISTS consultations ADD COLUMN IF NOT EXISTS scheduled_time VARCHAR(255);
ALTER TABLE IF EXISTS consultations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_consultations_student ON consultations(student_id);
CREATE INDEX IF NOT EXISTS idx_consultations_advisor ON consultations(advisor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

CREATE TABLE IF NOT EXISTS consultation_messages (
    id VARCHAR(36) PRIMARY KEY,
    consultation_id VARCHAR(36) NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_official BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation ON consultation_messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_sender ON consultation_messages(sender_id);
