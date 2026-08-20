CREATE TABLE IF NOT EXISTS forum_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_threads (
    id VARCHAR(36) PRIMARY KEY,
    author_id VARCHAR(36) NOT NULL REFERENCES users(id),
    category_id VARCHAR(36) NOT NULL REFERENCES forum_categories(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    views_count INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    official_reply_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON forum_threads(author_id);

CREATE TABLE IF NOT EXISTS forum_posts (
    id VARCHAR(36) PRIMARY KEY,
    thread_id VARCHAR(36) NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id VARCHAR(36) NOT NULL REFERENCES users(id),
    parent_id VARCHAR(36) REFERENCES forum_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    is_official_reply BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent ON forum_posts(parent_id);

CREATE TABLE IF NOT EXISTS post_likes (
    post_id VARCHAR(36) NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

INSERT INTO forum_categories (id, name, slug, display_order) VALUES
    (gen_random_uuid(), 'Thông báo', 'thong-bao', 1),
    (gen_random_uuid(), 'Tư vấn chọn ngành', 'tu-van-chon-nganh', 2),
    (gen_random_uuid(), 'Tư vấn chọn trường', 'tu-van-chon-truong', 3),
    (gen_random_uuid(), 'So sánh trường', 'so-sanh-truong', 4),
    (gen_random_uuid(), 'Điểm chuẩn', 'diem-chuan', 5),
    (gen_random_uuid(), 'Học tập & Luyện thi', 'hoc-tap-luyen-thi', 6),
    (gen_random_uuid(), 'Học bổng', 'hoc-bong', 7),
    (gen_random_uuid(), 'Kinh nghiệm phỏng vấn', 'kinh-nghiem-phong-van', 8)
ON CONFLICT (slug) DO NOTHING;
