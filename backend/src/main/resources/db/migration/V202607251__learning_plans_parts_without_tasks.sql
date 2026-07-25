-- Lưu tên các Part chưa tạo được ải lúc sinh plan (câu chưa gắn tag),
-- để cảnh báo "Part chưa có ải" vẫn hiển thị khi xem lại plan (không chỉ ở lần sinh đầu).
ALTER TABLE learning_plans ADD COLUMN parts_without_tasks text;
