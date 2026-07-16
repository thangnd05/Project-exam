-- Tài liệu recovery gắn theo Part (exam_part_id) + denormalize exam_type_id từ Part.
-- Khớp entity RecoveryResource (examTypeId/examPartId + 2 index FK theo convention).

ALTER TABLE recovery_resources ADD COLUMN exam_type_id varchar(255);
ALTER TABLE recovery_resources ADD COLUMN exam_part_id varchar(255);

CREATE INDEX idx_recovery_resources_exam_type_id ON recovery_resources (exam_type_id);
CREATE INDEX idx_recovery_resources_exam_part_id ON recovery_resources (exam_part_id);
