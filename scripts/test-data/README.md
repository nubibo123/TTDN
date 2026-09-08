# Dữ liệu test kiểm duyệt cộng đồng

Chạy thủ công trên database phát triển bằng psql (dùng PGHOST, PGUSER, PGDATABASE, PGPASSWORD theo môi trường):

```sh
psql -v ON_ERROR_STOP=1 -f scripts/test-data/forum-ai.sql
```

Script tạo 12 bài hiển thị trên trang Cộng đồng, với tác giả **Tài khoản test kiểm duyệt AI** (khóa đăng nhập). Chạy lại không thêm trùng và không ghi đè bài đã sửa. Không tự chạy khi khởi động ứng dụng.

| Số thứ tự trong file seed | Kỳ vọng |
| --- | --- |
| 001–002 | Lạc chủ đề (`off_topic`) |
| 003–004 | Quảng cáo/spam (`spam`) |
| 005–008 | Xúc phạm, có cả tiếng Việt không dấu (`abusive`) |
| 009–012 | Hợp lệ (`allow`), gồm góp ý tiêu cực lịch sự và trích dẫn lời xúc phạm để báo cáo |

Nhãn kỳ vọng chỉ nằm trong script, không chèn vào nội dung bài gửi model. Đây là dữ liệu để thử nghiệm, chưa phải kết quả AI. Các bài được chèn trực tiếp để test kiểm duyệt bài có sẵn; muốn test kiểm duyệt lúc đăng, dùng lại tiêu đề/nội dung qua form tạo bài.

Xóa 12 bài test (và các phản hồi/lượt thích phụ thuộc theo khóa ngoại của database), giữ tài khoản test bị khóa:

```sh
psql -v ON_ERROR_STOP=1 -f scripts/test-data/forum-ai-cleanup.sql
```

Bộ dữ liệu không phụ thuộc model; cách chạy kiểm tra qua Gemini được mô tả bên dưới.

## Kiểm tra bằng Gemini API

Model mặc định: `gemini-3.5-flash-lite`. Tạo API key trong Google AI Studio và giữ project ở Free Tier nếu chỉ muốn dùng quota miễn phí.

- Chạy backend trực tiếp: đặt `GEMINI_API_KEY` trong environment của tiến trình Java/IDE, rồi khởi động lại backend. Có thể đổi `GEMINI_MODEL` nếu cần. Spring Boot không tự đọc file `.env` ở thư mục gốc.
- Docker Compose: đặt hai biến trên trong `.env` (tham khảo `.env.example`), rồi tạo lại backend bằng `docker compose up -d --build backend`.
- Đăng nhập ADMIN → Quản lý Bài viết Diễn đàn → Xem chi tiết → **Kiểm tra AI**.
- Endpoint dành riêng ADMIN: `POST /api/admin/forum-threads/{id}/moderate`.

Backend gửi tiêu đề và nội dung đã lưu đến Gemini, trả `label`, `reason`, `model`. UI hiển thị gợi ý trong lần xem hiện tại; chưa lưu kết quả hay tự xóa/ẩn bài. Thiếu key, hết quota, lỗi mạng, phản hồi bị lọc hoặc sai định dạng đều trả `needs_review`, không kết luận vi phạm. Mỗi lần bấm gọi một request, không tự retry. API key chỉ nằm ở backend; không đặt trong biến `VITE_*`.

Tài liệu: https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite và https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite . Quota thực tế kiểm tra trong AI Studio; code không xác định được project đang dùng Free hay Paid Tier.

ID bài test là UUID bình thường. `forum-ai-ids.json` ánh xạ số thứ tự fixture cũ sang UUID để đối chiếu kỳ vọng. Có thể kiểm tra AI tại **Tổng quan hệ thống → Kiểm duyệt** hoặc trong chi tiết bài ở trang quản lý diễn đàn.

Trong **Tổng quan hệ thống → Kiểm duyệt**, bấm **Kiểm tra toàn bộ**: tải danh sách mới nhất và gọi AI tuần tự cho tất cả bài viết. Có tiến độ, tổng hợp nhãn và nút Dừng (hoàn tất request hiện tại rồi dừng). Lỗi từng bài được đánh dấu cần kiểm tra thủ công và tiếp tục bài sau. Rời tab sẽ ngừng gửi bài tiếp theo.

## Bình luận mẫu

Chạy `psql -f scripts/test-data/forum-comments.sql` để thêm 12 bình luận UUID (chạy lại không trùng) vào một bài viết hiện có, ưu tiên bài hỏi 24 điểm A00. Dùng tài khoản test riêng bị khóa. Nhãn kỳ vọng nằm trong `forum-comments.expected.json`: 2 lạc chủ đề, 2 spam, 4 xúc phạm, 4 hợp lệ. Xóa bằng `forum-comments-cleanup.sql`.

Khởi động lại backend rồi vào Tổng quan → Kiểm duyệt → **Kiểm tra toàn bộ bình luận**. Quét tuần tự tất cả bình luận chưa xóa, gồm cả bình luận ngoài bộ test. Endpoint dành ADMIN: `POST /api/admin/forum-posts/{id}/moderate`. AI phân loại nội dung bình luận; kết quả không lưu vào database và không tự xóa.
