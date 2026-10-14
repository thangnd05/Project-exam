-- Đánh giá gắn với từng đề (hiện sau khi làm full). Đánh giá cũ không gắn đề giữ test_id NULL.
ALTER TABLE assessment.evaluation
    ADD COLUMN test_id VARCHAR(255);

ALTER TABLE assessment.evaluation
    ADD CONSTRAINT fk_evaluation_test_id FOREIGN KEY (test_id)
    REFERENCES assessment.tests(test_id) ON DELETE CASCADE;

-- Nội dung không bắt buộc, chỉ cần chọn số sao.
ALTER TABLE assessment.evaluation
    ALTER COLUMN content DROP NOT NULL;

-- Mỗi người chỉ đánh giá một đề một lần.
CREATE UNIQUE INDEX uk_evaluation_user_test
    ON assessment.evaluation (user_id, test_id)
    WHERE test_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_evaluation_test_id ON assessment.evaluation (test_id);
