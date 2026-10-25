-- Lượt bị hệ thống nộp hộ khi quá hạn (người làm đã bỏ đi). Vẫn là COMPLETED để giữ kết quả và tính lượt làm,
-- cờ này chỉ để thống kê tách khỏi lượt người dùng tự bấm nộp. Dữ liệu cũ không phân biệt được nên để FALSE.
ALTER TABLE assessment.user_tests
    ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN NOT NULL DEFAULT FALSE;
