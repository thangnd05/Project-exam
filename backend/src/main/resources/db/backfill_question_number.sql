-- Chạy một lần sau khi có cột question_number (ddl-auto hoặc migration thủ công).
-- Gán STT theo thứ tự created_at trong từng part + phạm vi kho.

UPDATE questions q
SET question_number = ranked.rn
FROM (
    SELECT question_id,
           ROW_NUMBER() OVER (
               PARTITION BY exam_part_id,
                            COALESCE(created_by, ''),
                            COALESCE(class_id, ''),
                            COALESCE(chapter_id, '')
               ORDER BY created_at ASC, question_id ASC
           ) AS rn
    FROM questions
    WHERE is_bank = true
) ranked
WHERE q.question_id = ranked.question_id
  AND q.is_bank = true
  AND (q.question_number IS NULL OR q.question_number = 0);
