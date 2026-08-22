-- ---------------------------------------------------------------------------
-- Câu mô tả giữa chứng chỉ ("for successfully completing and passing the ...")
-- trước đây hard-code ở frontend. Tách ra thành cấu hình theo mẫu:
--   null / rỗng = giữ câu mặc định, có giá trị = dùng nguyên văn cấu hình.
-- Chứng chỉ đã cấp không đổi vì phần trình bày được chụp lại trong template_snapshot.
-- ---------------------------------------------------------------------------
ALTER TABLE public.certificate_templates
    ADD COLUMN body_text character varying(500);
