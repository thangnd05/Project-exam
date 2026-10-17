-- Bảng xếp hạng lọc theo (test_id, status) rồi gom theo user_id: index ghép để khỏi quét mọi lượt thi của đề.
CREATE INDEX IF NOT EXISTS idx_user_tests_test_status_user
    ON assessment.user_tests (test_id, status, user_id)
    WHERE deleted_at IS NULL;
