-- Đề bật cờ này thì mỗi lượt làm nhận thứ tự câu riêng (xáo theo id lượt làm, nhóm đoạn văn giữ liền nhau).
ALTER TABLE assessment.tests
    ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE;
