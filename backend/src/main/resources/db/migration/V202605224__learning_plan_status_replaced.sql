-- CHECK constraint cũ trên learning_plans.status thiếu giá trị REPLACED.
-- Khi sinh plan mới, code set plan cũ sang REPLACED → vi phạm constraint → 409.

DO $$
DECLARE
    con_name text;
BEGIN
    -- Tìm tên CHECK constraint trên cột status (Hibernate đặt tên kiểu
    -- learning_plans_status_check, nhưng cũng có thể khác).
    FOR con_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'learning_plans'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE learning_plans DROP CONSTRAINT %I', con_name);
    END LOOP;
END $$;

ALTER TABLE learning_plans
    ADD CONSTRAINT learning_plans_status_check
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED', 'REPLACED'));
