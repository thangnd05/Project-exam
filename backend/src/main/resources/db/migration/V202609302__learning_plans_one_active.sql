-- Mỗi người chỉ có một lộ trình đang học cho mỗi kỳ thi.
-- Dọn các lộ trình ACTIVE bị trùng (do sinh đồng thời): giữ cái mới nhất, còn lại chuyển REPLACED.
WITH ranked AS (
    SELECT learning_plan_id,
           FIRST_VALUE(learning_plan_id) OVER w AS keep_id,
           ROW_NUMBER() OVER w AS rn
    FROM assessment.learning_plans
    WHERE status = 'ACTIVE' AND deleted_at IS NULL
    WINDOW w AS (PARTITION BY user_id, exam_type_id ORDER BY created_at DESC, learning_plan_id DESC)
)
UPDATE assessment.learning_plans p
SET status = 'REPLACED',
    replaced_by_plan_id = r.keep_id
FROM ranked r
WHERE p.learning_plan_id = r.learning_plan_id
  AND r.rn > 1;

CREATE UNIQUE INDEX uk_learning_plans_active_per_exam_type
    ON assessment.learning_plans (user_id, exam_type_id)
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;
