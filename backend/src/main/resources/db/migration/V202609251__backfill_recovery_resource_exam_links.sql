-- Gắn kỳ thi cho tài liệu đã có tag nhưng chưa có exam_type_id.
UPDATE recovery_resources AS resource
SET exam_type_id = picked.exam_type_id
FROM (
    SELECT DISTINCT ON (resource_tag.resource_id)
        resource_tag.resource_id,
        tag.exam_type_id
    FROM resource_tags AS resource_tag
    JOIN tags AS tag ON tag.tag_id = resource_tag.tag_id
    WHERE tag.exam_type_id IS NOT NULL
    ORDER BY resource_tag.resource_id, tag.exam_type_id
) AS picked
WHERE resource.resource_id = picked.resource_id
  AND resource.exam_type_id IS NULL;

-- Tài liệu chỉ thuộc một domain thì gắn đúng exam part cùng tên.
UPDATE recovery_resources AS resource
SET exam_part_id = matched.exam_part_id
FROM (
    SELECT single_domain.resource_id, exam_part.exam_part_id
    FROM (
        SELECT
            resource_tag.resource_id,
            MIN(child.exam_type_id) AS exam_type_id,
            MIN(parent.name) AS domain_name
        FROM resource_tags AS resource_tag
        JOIN tags AS child ON child.tag_id = resource_tag.tag_id
        JOIN tags AS parent ON parent.tag_id = child.parent_id
        GROUP BY resource_tag.resource_id
        HAVING COUNT(DISTINCT parent.tag_id) = 1
    ) AS single_domain
    JOIN exam_parts AS exam_part
        ON exam_part.exam_type_id = single_domain.exam_type_id
       AND exam_part.name = single_domain.domain_name
) AS matched
WHERE resource.resource_id = matched.resource_id
  AND resource.exam_part_id IS NULL;
