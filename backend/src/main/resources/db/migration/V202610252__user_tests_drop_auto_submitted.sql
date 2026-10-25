-- Bỏ cờ auto_submitted: thống kê admin không còn tách lượt hệ thống nộp hộ khỏi lượt người làm tự nộp.
ALTER TABLE assessment.user_tests
    DROP COLUMN IF EXISTS auto_submitted;
