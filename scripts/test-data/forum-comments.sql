\set ON_ERROR_STOP on
BEGIN;
INSERT INTO users (id,email,password_hash,name,is_active,created_at,updated_at)
VALUES ('comment-ai-test-author','comment-ai-test@example.invalid','!disabled','Tài khoản test bình luận AI',false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
CREATE TEMP TABLE comment_target ON COMMIT DROP AS
SELECT id FROM forum_threads ORDER BY (title LIKE '24 điểm%') DESC, created_at DESC, id LIMIT 1;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM comment_target) THEN RAISE EXCEPTION 'No forum thread available'; END IF; END $$;
INSERT INTO forum_posts (id,thread_id,author_id,content,likes_count,is_official_reply,is_deleted,created_at)
SELECT f.id,t.id,'comment-ai-test-author',f.content,0,false,false,CURRENT_TIMESTAMP
FROM (VALUES
('c4dbae46-4a4a-4c97-992d-eba1c745af6d', 'Tối nay ăn lẩu ở đâu ngon? Mình muốn tìm quán có chỗ đậu xe.'),
('3a8b0f76-b48c-4114-8ab0-b734afadb9c4', 'Có ai xem trận bóng hôm qua không, bàn thắng cuối đẹp quá!'),
('2ab5e3bd-b41e-4137-81aa-6863dd4da4e3', 'Bán điện thoại giá sốc, mua hai tặng một, nhắn tin để chốt đơn ngay!'),
('af0c5df6-8b2d-4b0c-aa95-fa55bd2639ac', 'Bỏ học đi, vào nhóm đầu tư của mình, cam kết nhân đôi tiền sau một tuần!'),
('c1ae0711-48d0-4dc2-99e1-1433c161354a', 'Mày ngu thế, có mỗi việc chọn ngành cũng không biết. Đừng hỏi nữa.'),
('629faa0d-4e09-438b-9d0a-00dfc89df441', 'Tư vấn như cứt, không biết gì thì cút đi, đừng làm người khác chọn sai trường.'),
('035fb6a3-b46f-49f9-80da-3cd3c328de86', 'May ngu vl, deo biet gi thi im di, dung len day sua nua.'),
('eddeb8fe-101d-4b66-bcf3-f6f9abe7c2d9', 'Điểm thấp thế thì mày là đồ vô dụng, chẳng làm được gì đâu.'),
('23ba6abd-309b-4aa3-8e63-cbaf8109efe0', 'Bạn nên xem điểm chuẩn các năm và học phí trước khi xếp nguyện vọng nhé.'),
('0b308da8-bb25-462b-9823-59487623a507', 'Mình chưa đồng ý với lời tư vấn này vì chưa xét điều kiện tài chính của gia đình.'),
('1ab0fb96-b3eb-4608-ad59-6a962cdb064c', 'Có người gọi mình là "đồ ngu" khi hỏi chọn ngành. Nhờ quản trị viên hướng dẫn cách báo cáo bình luận đó.'),
('68f9f338-a424-4165-a6ee-8eb2d23a66dc', 'Học bổng năm nhất có yêu cầu chứng chỉ ngoại ngữ không ạ?')) AS f(id,content) CROSS JOIN comment_target t
ON CONFLICT (id) DO NOTHING;
COMMIT;
