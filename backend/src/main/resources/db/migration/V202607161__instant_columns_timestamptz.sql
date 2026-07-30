

ALTER TABLE questions
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE recovery_resources
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
