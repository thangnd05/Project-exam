-- Lộ trình sinh theo syllabus (người mới, chưa làm bài nào) không có bài chẩn đoán gốc.
ALTER TABLE learning_plans ALTER COLUMN source_user_test_id DROP NOT NULL;
