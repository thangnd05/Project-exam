-- Tài liệu có thể phủ nhiều phần thi: phần thi được suy ra từ tag (resource_tags -> tags.exam_part_id).
-- exam_type_id vẫn giữ để lọc theo kỳ thi.
ALTER TABLE assessment.recovery_resources DROP CONSTRAINT IF EXISTS fk_recovery_resources_exam_part_id;
DROP INDEX IF EXISTS assessment.idx_recovery_resources_exam_part_id;
ALTER TABLE assessment.recovery_resources DROP COLUMN IF EXISTS exam_part_id;
