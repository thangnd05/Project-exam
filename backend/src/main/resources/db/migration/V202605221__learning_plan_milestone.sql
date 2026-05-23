-- Lộ trình vượt ải: cột mới trên learning_plans + bảng task/session/exposure

ALTER TABLE learning_plans
    ADD COLUMN IF NOT EXISTS user_target_id VARCHAR(36);

ALTER TABLE learning_plans
    ADD COLUMN IF NOT EXISTS plan_stage VARCHAR(20);

ALTER TABLE learning_plans
    ADD COLUMN IF NOT EXISTS current_task_id VARCHAR(36);

ALTER TABLE learning_plans
    ADD COLUMN IF NOT EXISTS pass_accuracy_default INTEGER;

UPDATE learning_plans
SET plan_stage = 'FOUNDATION'
WHERE plan_stage IS NULL;

UPDATE learning_plans
SET pass_accuracy_default = 70
WHERE pass_accuracy_default IS NULL;

ALTER TABLE learning_plans
    ALTER COLUMN plan_stage SET NOT NULL;

ALTER TABLE learning_plans
    ALTER COLUMN pass_accuracy_default SET NOT NULL;

ALTER TABLE learning_plans
    ALTER COLUMN pass_accuracy_default SET DEFAULT 70;

ALTER TABLE learning_plans
    ALTER COLUMN plan_stage SET DEFAULT 'FOUNDATION';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'learning_plans'
          AND column_name = 'deadline_days'
          AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE learning_plans ALTER COLUMN deadline_days DROP NOT NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS learning_plan_tasks (
    task_id              VARCHAR(36) PRIMARY KEY,
    learning_plan_id     VARCHAR(36) NOT NULL,
    tag_id               VARCHAR(36) NOT NULL,
    exam_part_id         VARCHAR(36) NOT NULL,
    task_order           INTEGER NOT NULL,
    status               VARCHAR(20) NOT NULL,
    pass_accuracy        INTEGER NOT NULL DEFAULT 70,
    baseline_accuracy    NUMERIC(5, 2),
    best_accuracy        NUMERIC(5, 2),
    attempt_count        INTEGER NOT NULL DEFAULT 0,
    passed_at            TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_plan_tasks_plan
    ON learning_plan_tasks (learning_plan_id, task_order);

CREATE TABLE IF NOT EXISTS learning_plan_sessions (
    session_id           VARCHAR(36) PRIMARY KEY,
    learning_plan_id     VARCHAR(36) NOT NULL,
    task_id              VARCHAR(36),
    plan_stage           VARCHAR(20) NOT NULL,
    resource_id          VARCHAR(36),
    question_count       INTEGER NOT NULL,
    status               VARCHAR(20) NOT NULL,
    accuracy             INTEGER,
    passed               BOOLEAN,
    started_at           TIMESTAMP NOT NULL,
    submitted_at         TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_plan_sessions_plan_status
    ON learning_plan_sessions (learning_plan_id, status);

CREATE TABLE IF NOT EXISTS learning_plan_session_questions (
    id                   VARCHAR(36) PRIMARY KEY,
    session_id           VARCHAR(36) NOT NULL,
    question_id          VARCHAR(36) NOT NULL,
    display_order        INTEGER NOT NULL,
    CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS learning_plan_session_answers (
    id                   VARCHAR(36) PRIMARY KEY,
    session_id           VARCHAR(36) NOT NULL,
    question_id          VARCHAR(36) NOT NULL,
    selected_answer_id   VARCHAR(36),
    is_correct           BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_session_answer_question UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS user_question_exposures (
    id                   VARCHAR(36) PRIMARY KEY,
    user_id              VARCHAR(36) NOT NULL,
    question_id          VARCHAR(36) NOT NULL,
    first_seen_at        TIMESTAMP NOT NULL,
    last_seen_at         TIMESTAMP NOT NULL,
    times_seen           INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT uq_user_question_exposure UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_question_exposure_user
    ON user_question_exposures (user_id);
