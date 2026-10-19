-- Slug cho URL thân thiện (vd /my-target/aws/saa-c03) thay cho examTypeId dạng UUID.
-- Sinh cho dữ liệu sẵn có, cùng quy tắc với SlugUtils.fromExamName:
--   1. Tên kết thúc bằng mã kỳ thi trong ngoặc -> dùng mã: "... (SAA-C03)" -> "saa-c03".
--   2. Không có mã -> bỏ dấu tiếng Việt, nối bằng gạch ngang: "Thông Thường" -> "thong-thuong".
--   3. Trùng nhau -> thêm hậu tố -2, -3... (bản ghi còn hoạt động được giữ slug gốc).
ALTER TABLE assessment.exam_types ADD COLUMN slug character varying(100);

WITH base AS (
    SELECT exam_type_id,
           deleted_at,
           left(COALESCE(
               NULLIF(lower(substring(name FROM '\(([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)\)\s*$')), ''),
               NULLIF(trim(BOTH '-' FROM regexp_replace(
                   lower(translate(normalize(name, NFC),
                       'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
                       'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD')),
                   '[^a-z0-9]+', '-', 'g')), ''),
               'exam'
           ), 90) AS raw_slug
    FROM assessment.exam_types
),
ranked AS (
    SELECT exam_type_id,
           raw_slug,
           row_number() OVER (PARTITION BY raw_slug ORDER BY (deleted_at IS NOT NULL), exam_type_id) AS rn
    FROM base
)
UPDATE assessment.exam_types e
SET slug = CASE WHEN r.rn = 1 THEN r.raw_slug ELSE r.raw_slug || '-' || r.rn END
FROM ranked r
WHERE e.exam_type_id = r.exam_type_id;

ALTER TABLE assessment.exam_types ALTER COLUMN slug SET NOT NULL;

-- Chỉ ràng buộc duy nhất giữa các bản ghi chưa xoá mềm để slug của kỳ thi đã xoá được dùng lại.
CREATE UNIQUE INDEX uq_exam_types_slug ON assessment.exam_types (slug) WHERE deleted_at IS NULL;
