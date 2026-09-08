-- Development fixtures only; not a Flyway migration.
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO users (id, email, password_hash, name, is_active, created_at, updated_at)
VALUES ('aitest-forum-author', 'forum-ai-test@example.invalid', '!disabled', 'Tài khoản test kiểm duyệt AI', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
CREATE TEMP TABLE ai_fixtures (id varchar(36), slug text, title text, content text, expected text) ON COMMIT DROP;
INSERT INTO ai_fixtures VALUES
('56ecac15-74d5-4bf2-9383-758dfe0d95a9', 'hoi-dap', 'Tối nay nấu món gì cho dễ?', 'Nhà còn trứng, cà chua và thịt băm. Mọi người chỉ mình cách nấu bữa tối nhanh với, cuối tuần mình muốn học làm bánh nữa.', 'off_topic'),
('e090ad85-1e80-457e-a9de-e12cf5a2a13b', 'hoi-dap', 'Bàn về trận bóng tối qua', 'Đội khách đá phòng ngự chặt quá, hiệp hai bỏ lỡ ba cơ hội. Mọi người nghĩ ai sẽ vô địch mùa này?', 'off_topic'),
('65579594-87b8-4332-89fa-b82a81944be7', 'hoi-dap', 'Thanh lý điện thoại, chốt đơn ngay', 'Điện thoại mới giá rẻ, mua hai tặng một! Ai cần thì bình luận để mình gửi bảng giá. Đặt hàng ngay hôm nay để nhận ưu đãi!', 'spam'),
('7e58c17f-1232-43b7-8a2e-492fe0a9fc1b', 'tu-van-chon-nganh', 'Chọn ngành gì cũng được, vào nhóm kiếm tiền ngay', 'Không cần học đại học, tham gia nhóm đầu tư của mình là có lãi mỗi ngày. Cam kết lợi nhuận gấp đôi, nhắn tin ngay để được hướng dẫn nạp tiền.', 'spam'),
('d38f04ac-98ce-4e53-8505-59a2d4e19bec', 'tu-van-chon-nganh', 'Hỏi chọn ngành mà hỏi ngu thế', 'Mày ngu quá, câu đơn giản thế cũng hỏi. Không biết tự tìm à? Đừng đăng mấy câu vô dụng làm rác diễn đàn nữa.', 'abusive'),
('b8a55206-03a5-45cc-aff4-b31d7f683568', 'tu-van-chon-truong', 'Tư vấn kiểu này thì im đi', 'Mày tư vấn như cứt, chẳng biết cái mẹ gì mà cũng lên mặt dạy người khác chọn trường. Cút khỏi bài của tao đi.', 'abusive'),
('b448e5f0-2334-4340-807f-91e9dc332af6', 'diem-chuan', 'Điểm thấp thì đừng lên tiếng', 'Có từng đó điểm mà cũng đòi vào đại học, đồ vô dụng. Mày chỉ làm trò cười cho người khác thôi.', 'abusive'),
('32c2d372-4398-4ac8-bcde-dbb731926af9', 'hoi-dap', 'Tu van nhu vay ma cung dang bai', 'May ngu vl, deo biet gi thi im di. Dung len day sua linh tinh lam nguoi khac chon sai truong.', 'abusive'),
('3414c3e8-049d-4c0d-8520-490b2c770efc', 'tu-van-chon-nganh', '24 điểm A00 nên cân nhắc ngành CNTT thế nào?', 'Em được 24 điểm A00 và thích lập trình. Em muốn tìm trường có học phí phù hợp với gia đình, mọi người tư vấn giúp em cách sắp xếp nguyện vọng với ạ.', 'allow'),
('58c54858-715d-4fb9-9c23-a601a4ec7bc0', 'tu-van-chon-truong', 'Chưa hài lòng với buổi tư vấn tuyển sinh', 'Mình thấy buổi tư vấn chưa giải thích rõ học phí và điều kiện học bổng. Mong nhà trường công khai thêm thông tin để thí sinh dễ so sánh trước khi đăng ký.', 'allow'),
('8aaa2169-259e-47ed-8ccb-ee476d73d50f', 'hoi-dap', 'Nên xử lý thế nào khi bị xúc phạm lúc hỏi tuyển sinh?', 'Em hỏi về chọn ngành thì có người gọi em là "đồ ngu" và bảo em "cút đi". Em muốn báo cáo bình luận đó, nhờ quản trị viên hướng dẫn giúp em.', 'allow'),
('57223114-f492-4668-b7bc-da3a0ee240f8', 'hoc-bong', 'Tìm học bổng cho sinh viên có hoàn cảnh khó khăn', 'Gia đình em thu nhập thấp, em muốn tìm học bổng hỗ trợ học phí năm nhất. Ngoài điểm thi thì cần chuẩn bị giấy tờ gì và theo dõi thông báo ở đâu ạ?', 'allow');
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM ai_fixtures f LEFT JOIN forum_categories c ON c.slug = f.slug WHERE c.id IS NULL) THEN
        RAISE EXCEPTION 'Missing fixture categories; no test data inserted';
    END IF;
END $$;
INSERT INTO forum_threads (id, author_id, category_id, title, content, views_count, likes_count, is_pinned, is_locked, created_at, updated_at)
SELECT f.id, 'aitest-forum-author', c.id, f.title, f.content, 0, 0, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ai_fixtures f JOIN forum_categories c ON c.slug = f.slug
ON CONFLICT (id) DO NOTHING;
SELECT id, expected FROM ai_fixtures ORDER BY id;
COMMIT;
