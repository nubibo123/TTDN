-- V11: Thread likes (heart reaction on forum threads)
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS forum_thread_likes (
    thread_id VARCHAR(36) NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id, user_id)
);