-- Đổi tên: readiness trên plan là snapshot bài chẩn đoán, không phải điểm phiên học ải.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'learning_plans' AND column_name = 'current_readiness'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'learning_plans' AND column_name = 'baseline_readiness'
    ) THEN
        ALTER TABLE learning_plans RENAME COLUMN current_readiness TO baseline_readiness;
    END IF;
END $$;
