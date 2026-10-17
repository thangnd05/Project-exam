-- Thang điểm lưu theo từng loại kỳ thi thay vì hardcode trong code.
-- Chấm tuyến tính: điểm = score_min + (đúng / tổng) × (score_max − score_min).
-- TOEIC_SCALE vẫn chấm theo bảng scoring_conversions; min/max chỉ dùng để hiển thị.
ALTER TABLE assessment.exam_types
    ADD COLUMN score_min  integer NOT NULL DEFAULT 0,
    ADD COLUMN score_max  integer NOT NULL DEFAULT 100;

UPDATE assessment.exam_types SET score_min = 100, score_max = 1000
WHERE upper(scoring_method) = 'AWS_SCALE';

UPDATE assessment.exam_types SET score_min = 10, score_max = 990
WHERE upper(scoring_method) = 'TOEIC_SCALE';

-- Thang đã nằm ở score_min/score_max nên AWS_SCALE không còn khác DEFAULT;
-- IELTS_BAND chưa từng được backend xử lý (vẫn chấm như DEFAULT). Gộp cả hai về DEFAULT.
UPDATE assessment.exam_types SET scoring_method = 'DEFAULT'
WHERE upper(scoring_method) IN ('AWS_SCALE', 'IELTS_BAND');

ALTER TABLE assessment.exam_types
    ADD CONSTRAINT chk_exam_types_score_range CHECK (score_min < score_max);
