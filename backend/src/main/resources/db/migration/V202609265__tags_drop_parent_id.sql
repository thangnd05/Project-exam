-- Tag giờ phẳng trong từng phần thi (exam_part_id), không còn phân cấp cha-con.
-- Sau V202609264 mọi tag đều có parent_id NULL.
ALTER TABLE assessment.tags DROP CONSTRAINT IF EXISTS fk_tags_parent_id;
DROP INDEX IF EXISTS assessment.idx_tags_parent_id;
ALTER TABLE assessment.tags DROP COLUMN IF EXISTS parent_id;
