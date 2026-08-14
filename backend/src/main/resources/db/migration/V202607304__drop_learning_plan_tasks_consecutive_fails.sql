-- Bỏ cột consecutive_fails của learning_plan_tasks.
--
-- Nhãn "Đang bí" trên UI giờ tính bằng: ải chưa PASSED và attempt_count >= 3  tức
-- "đã luyện 3 lượt mà chưa qua", đúng thứ người học thấy trong lịch sử ải. Cột cũ đếm
-- chuỗi TRƯỢT LIÊN TIẾP: là trạng thái dẫn xuất phải tự cập nhật mỗi lần nộp (kèm 1 query
-- lấy 5 phiên gần nhất), dễ lệch, và không giải thích được cho người dùng.
--
-- Dữ liệu trong cột là dẫn xuất hoàn toàn từ learning_plan_sessions nên bỏ đi không mất gì:
-- cần thì tính lại được từ lịch sử phiên.
ALTER TABLE learning_plan_tasks DROP COLUMN IF EXISTS consecutive_fails;
