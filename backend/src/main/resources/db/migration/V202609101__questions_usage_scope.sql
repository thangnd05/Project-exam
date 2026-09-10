-- ============================================================================
-- Tách câu hỏi ra đề thi và câu hỏi ôn tập.
--
-- Trước migration này hai luồng bốc câu múc chung một hồ:
--   * tạo đề từ kho  -> TestQuestionAssignmentService, lọc mỗi is_bank = true
--   * sinh phiên lộ trình -> LearningPlanSessionService, KHÔNG lọc gì cả nên
--     quét toàn bộ câu của Part, kể cả câu viết riêng cho đề thi.
-- usage_scope là ranh giới đó: EXAM chỉ ra đề, PRACTICE chỉ ôn tập/lộ trình.
--
-- ---------------------------------------------------------------------------
-- BACKFILL: mọi câu đang có đổ về 'EXAM'.
--
-- Lý do: toàn bộ câu trong bảng hiện nay đều sinh ra từ luồng tạo đề
-- (createAndAttach / bulkCreateQuestions trong QuestionService), nên EXAM là
-- đúng nguồn gốc của chúng.
--
-- HỆ QUẢ PHẢI BIẾT TRƯỚC: ngay sau khi chạy, pool ôn tập của lộ trình sẽ RỖNG
-- cho tới khi có câu được gắn PRACTICE. Ải trong lộ trình sẽ tự khoá vì
-- LearningPlanProgressSupport.hasQuestionsForTask() không tìm thấy câu nào.
--
-- Muốn ngược lại (lộ trình chạy tiếp như cũ, đổi lại là màn tạo đề từ kho rỗng)
-- thì đổi 'EXAM' thành 'PRACTICE' ở đúng câu UPDATE bên dưới, phần còn lại giữ
-- nguyên.
-- ---------------------------------------------------------------------------

ALTER TABLE public.questions
    ADD COLUMN usage_scope character varying(255) DEFAULT 'EXAM'::character varying;

UPDATE public.questions SET usage_scope = 'EXAM' WHERE usage_scope IS NULL;

ALTER TABLE public.questions
    ALTER COLUMN usage_scope SET NOT NULL;

-- Khai báo CHECK ở migration, không để Hibernate tự sinh: thêm giá trị enum mới
-- sau này phải đi kèm một migration ALTER CHECK, đừng sửa tay trên DB.
ALTER TABLE public.questions
    ADD CONSTRAINT questions_usage_scope_check
    CHECK (((usage_scope)::text = ANY ((ARRAY['EXAM'::character varying, 'PRACTICE'::character varying])::text[])));

-- Cả hai luồng đều lọc theo (exam_part_id, usage_scope) nên đánh index ghép.
CREATE INDEX idx_questions_usage_scope ON public.questions (exam_part_id, usage_scope);
