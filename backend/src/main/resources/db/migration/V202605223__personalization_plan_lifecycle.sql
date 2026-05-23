-- Tách mục tiêu (user_target_parts) vs plan snapshot vs priority ải

ALTER TABLE user_target_parts
    ADD COLUMN IF NOT EXISTS current_score DECIMAL(5, 2);

ALTER TABLE user_target_parts
    ADD COLUMN IF NOT EXISTS last_user_test_id VARCHAR(36);

ALTER TABLE user_targets
    ADD COLUMN IF NOT EXISTS target_readiness INTEGER;

ALTER TABLE user_targets
    ADD COLUMN IF NOT EXISTS achieved_at TIMESTAMP;

ALTER TABLE learning_plans
    ADD COLUMN IF NOT EXISTS plan_sequence INTEGER;

ALTER TABLE learning_plans
    ADD COLUMN IF NOT EXISTS replaced_by_plan_id VARCHAR(36);

ALTER TABLE learning_plan_tasks
    ADD COLUMN IF NOT EXISTS priority_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE learning_plan_tasks
    ADD COLUMN IF NOT EXISTS wrong_count_at_diagnosis INTEGER;

UPDATE learning_plans lp
SET plan_sequence = sub.seq
FROM (
    SELECT learning_plan_id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, exam_type_id
               ORDER BY created_at ASC
           ) AS seq
    FROM learning_plans
) sub
WHERE lp.learning_plan_id = sub.learning_plan_id
  AND lp.plan_sequence IS NULL;
