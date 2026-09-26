-- Tag gốc trước đây chỉ lặp lại tên ExamPart. Gắn tag trực tiếp vào exam_parts
-- (exam_part_id NULL = tag dùng chung cho cả exam type) rồi bỏ lớp tag gốc thừa.

ALTER TABLE assessment.tags ADD COLUMN exam_part_id VARCHAR(255);

ALTER TABLE assessment.tags
    ADD CONSTRAINT fk_tags_exam_part_id FOREIGN KEY (exam_part_id)
        REFERENCES assessment.exam_parts (exam_part_id) ON DELETE SET NULL;

CREATE INDEX idx_tags_exam_part_id ON assessment.tags (exam_part_id);

-- Ghép tag gốc -> part: ưu tiên trùng tên, nếu không thì lấy part chiếm đa số
-- trong các câu hỏi đang gắn tag con của nó (vd "... Infrastructure as Code" vs "... IaC").
CREATE TEMP TABLE tmp_root_part ON COMMIT DROP AS
SELECT r.tag_id AS root_id, p.exam_part_id
FROM assessment.tags r
JOIN assessment.exam_parts p
  ON p.exam_type_id = r.exam_type_id
 AND lower(trim(p.name)) = lower(trim(r.name))
WHERE r.parent_id IS NULL;

INSERT INTO tmp_root_part (root_id, exam_part_id)
SELECT DISTINCT ON (r.tag_id) r.tag_id, q.exam_part_id
FROM assessment.tags r
JOIN assessment.tags c ON c.parent_id = r.tag_id
JOIN assessment.question_tags qt ON qt.tag_id = c.tag_id
JOIN assessment.questions q ON q.question_id = qt.question_id
JOIN assessment.exam_parts p ON p.exam_part_id = q.exam_part_id AND p.exam_type_id = r.exam_type_id
WHERE r.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM tmp_root_part m WHERE m.root_id = r.tag_id)
GROUP BY r.tag_id, q.exam_part_id
ORDER BY r.tag_id, count(*) DESC;

-- Mỗi part chỉ nhận một tag gốc; nếu có trùng thì giữ nguyên các root còn lại.
DELETE FROM tmp_root_part a
USING tmp_root_part b
WHERE a.exam_part_id = b.exam_part_id AND a.root_id > b.root_id;

-- Gán part cho toàn bộ hậu duệ của tag gốc đã ghép được.
WITH RECURSIVE descendants AS (
    SELECT c.tag_id, m.exam_part_id
    FROM tmp_root_part m
    JOIN assessment.tags c ON c.parent_id = m.root_id
    UNION ALL
    SELECT t.tag_id, d.exam_part_id
    FROM assessment.tags t
    JOIN descendants d ON t.parent_id = d.tag_id
)
UPDATE assessment.tags t
SET exam_part_id = d.exam_part_id
FROM descendants d
WHERE t.tag_id = d.tag_id;

UPDATE assessment.tags r
SET exam_part_id = m.exam_part_id
FROM tmp_root_part m
WHERE r.tag_id = m.root_id;

-- Root đang được câu hỏi / tài liệu / lộ trình tham chiếu thì giữ lại (đã có part), không xoá.
DELETE FROM tmp_root_part m
WHERE EXISTS (SELECT 1 FROM assessment.question_tags qt WHERE qt.tag_id = m.root_id)
   OR EXISTS (SELECT 1 FROM assessment.resource_tags rt WHERE rt.tag_id = m.root_id)
   OR EXISTS (SELECT 1 FROM assessment.learning_plan_tasks l WHERE l.tag_id = m.root_id);

-- Con trực tiếp của root thành cấp cao nhất trong part.
UPDATE assessment.tags c
SET parent_id = NULL
FROM tmp_root_part m
WHERE c.parent_id = m.root_id;

DELETE FROM assessment.tags r
USING tmp_root_part m
WHERE r.tag_id = m.root_id;
