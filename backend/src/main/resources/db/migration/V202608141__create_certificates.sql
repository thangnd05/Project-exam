-- ============================================================================
-- Chứng chỉ hoàn thành bài thi (kiểu AWS: chỉ Đạt / Chưa đạt, không phân hạng).
--
--   certificate_templates  cấu hình mẫu chứng chỉ của MỘT loại đề (exam_type):
--                          ngưỡng đạt + phần trình bày (logo, chữ ký, màu...).
--   user_certificates      chứng chỉ đã cấp cho người dùng.
--
-- Đề nào được cấp chứng chỉ: KHÔNG hardcode code 'FULL_MOCK' trong Java mà đánh
-- cờ certificate_eligible trên exam_categories  đúng cách cột guest_allowed
-- của chính bảng này đang hoạt động. Admin đổi/thêm nhóm đề về sau không phải
-- sửa code. Migration bật sẵn cờ cho nhóm FULL_MOCK đang có.
--
-- Mỗi người chỉ giữ MỘT chứng chỉ còn hiệu lực cho mỗi loại đề (unique một phần
-- theo status='ACTIVE'): thi lại bao nhiêu lần cũng được nhưng không sinh thêm
-- chứng chỉ. Thu hồi (REVOKED) không vướng ràng buộc, nên người bị thu hồi vẫn
-- có thể được cấp lại ở lần đạt sau.
--
-- Quyền CERTIFICATE:MANAGE không seed ở đây: DataLoader tự đồng bộ bảng
-- permissions từ PermissionCatalog.ALL mỗi lần khởi động.
-- ============================================================================

ALTER TABLE public.exam_categories
    ADD COLUMN certificate_eligible boolean NOT NULL DEFAULT false;

UPDATE public.exam_categories SET certificate_eligible = true WHERE code = 'FULL_MOCK';

-- ---------------------------------------------------------------------------
-- Mẫu chứng chỉ: một dòng cho một loại đề.
-- ---------------------------------------------------------------------------
CREATE TABLE public.certificate_templates (
    template_id          character varying(255) NOT NULL,
    exam_type_id         character varying(255) NOT NULL,
    active               boolean NOT NULL DEFAULT true,

    -- Điều kiện cấp duy nhất. Thang điểm theo scoring_method của loại đề
    -- (AWS_SCALE: 100-1000, mặc định chuẩn AWS là 720).
    pass_score           integer NOT NULL,

    title                character varying(200) NOT NULL,
    subtitle             character varying(300),
    footer_note          character varying(500),

    logo_url             character varying(500),
    background_url       character varying(500),
    accent_color         character varying(20),

    issuer_name          character varying(150),
    signature_name       character varying(150),
    signature_title      character varying(150),
    signature_image_url  character varying(500),

    -- null = chứng chỉ vô thời hạn (AWS thật là 36 tháng).
    valid_months         integer,

    created_at           timestamp(6) with time zone NOT NULL,
    updated_at           timestamp(6) with time zone NOT NULL,

    CONSTRAINT certificate_templates_pkey PRIMARY KEY (template_id),
    CONSTRAINT uk_certificate_templates_exam_type UNIQUE (exam_type_id),
    CONSTRAINT fk_certificate_templates_exam_type_id FOREIGN KEY (exam_type_id)
        REFERENCES public.exam_types(exam_type_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Chứng chỉ đã cấp.
--
-- recipient_name/test_title/template_snapshot là bản chụp lúc cấp: admin sửa mẫu
-- hay người dùng đổi tên về sau đều không làm biến dạng chứng chỉ đã phát hành.
-- Vì vậy mọi khoá ngoại ở đây đều SET NULL thay vì CASCADE (trừ user): xoá đề
-- hoặc xoá mẫu không được phép làm bốc hơi chứng chỉ của người học.
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_certificates (
    certificate_id      character varying(255) NOT NULL,
    user_id             character varying(255) NOT NULL,
    exam_type_id        character varying(255) NOT NULL,
    template_id         character varying(255),
    user_test_id        character varying(255),
    test_id             character varying(255),

    -- Mã tra cứu công khai, in trên chứng chỉ: EXAM-2026-XXXXXX
    certificate_code    character varying(40) NOT NULL,

    score               integer NOT NULL,
    status              character varying(20) NOT NULL DEFAULT 'ACTIVE',

    recipient_name      character varying(255) NOT NULL,
    test_title          character varying(255),
    template_snapshot   text NOT NULL,

    issued_at           timestamp(6) with time zone NOT NULL,
    expires_at          timestamp(6) with time zone,
    revoked_at          timestamp(6) with time zone,
    revoked_reason      character varying(500),

    CONSTRAINT user_certificates_pkey PRIMARY KEY (certificate_id),
    CONSTRAINT uk_user_certificates_code UNIQUE (certificate_code),
    CONSTRAINT user_certificates_status_check CHECK (status IN ('ACTIVE', 'REVOKED')),
    CONSTRAINT fk_user_certificates_user_id FOREIGN KEY (user_id)
        REFERENCES public.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_certificates_exam_type_id FOREIGN KEY (exam_type_id)
        REFERENCES public.exam_types(exam_type_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_certificates_template_id FOREIGN KEY (template_id)
        REFERENCES public.certificate_templates(template_id) ON DELETE SET NULL,
    CONSTRAINT fk_user_certificates_user_test_id FOREIGN KEY (user_test_id)
        REFERENCES public.user_tests(user_test_id) ON DELETE SET NULL,
    CONSTRAINT fk_user_certificates_test_id FOREIGN KEY (test_id)
        REFERENCES public.tests(test_id) ON DELETE SET NULL
);

-- Mỗi người một chứng chỉ còn hiệu lực cho mỗi loại đề.
CREATE UNIQUE INDEX uk_user_certificates_active_per_exam_type
    ON public.user_certificates USING btree (user_id, exam_type_id)
    WHERE status = 'ACTIVE';

CREATE INDEX idx_user_certificates_user_id ON public.user_certificates USING btree (user_id);
CREATE INDEX idx_user_certificates_exam_type_id ON public.user_certificates USING btree (exam_type_id);
CREATE INDEX idx_user_certificates_user_test_id ON public.user_certificates USING btree (user_test_id);
