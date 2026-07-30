-- Dọn phần lộ trình học chưa từng được dùng tới.

-- 1. Bảng phase: sinh lộ trình đi thẳng ra learning_plan_tasks, chưa bao giờ ghi/đọc bảng này.
DROP TABLE IF EXISTS learning_plan_phases;

-- 2. learning_plans.current_task_id: chỉ từng được set NULL, không nơi nào đọc (FK + index tự drop theo).
ALTER TABLE learning_plans DROP COLUMN IF EXISTS current_task_id;

-- 3. Bỏ trạm MIX: quy về MOCK nếu đã vượt hết ải, còn lại về FOUNDATION (đúng logic effectiveStage cũ).
UPDATE learning_plans p
SET plan_stage = CASE
        WHEN EXISTS (SELECT 1 FROM learning_plan_tasks t
                     WHERE t.learning_plan_id = p.learning_plan_id)
             AND NOT EXISTS (SELECT 1 FROM learning_plan_tasks t
                             WHERE t.learning_plan_id = p.learning_plan_id
                               AND t.status <> 'PASSED')
        THEN 'MOCK'
        ELSE 'FOUNDATION'
    END
WHERE plan_stage = 'MIX';

-- 4. learning_plan_sessions.plan_stage: phiên luôn được tạo ở FOUNDATION nên cột không mang thông tin
--    (CHECK constraint learning_plan_sessions_plan_stage_check drop theo cột).
ALTER TABLE learning_plan_sessions DROP COLUMN IF EXISTS plan_stage;

-- 5. learning_plan_tasks.priority_score: chỉ còn là tie-break trong bộ nhớ lúc sinh lộ trình, không lưu nữa.
ALTER TABLE learning_plan_tasks DROP COLUMN IF EXISTS priority_score;
