-- Slug cho URL thân thiện của đề (vd /tests/aws-dop-c02-test-1/leaderboard) thay cho testId dạng UUID.
-- Sinh cho dữ liệu sẵn có, cùng quy tắc với SlugUtils.toSlug + TestSlugService:
--   1. Bỏ dấu tiếng Việt, chữ thường, ký tự khác chữ/số thành gạch ngang: "AWS DOP-C02 Test 1" -> "aws-dop-c02-test-1".
--   2. Tên rỗng sau khi chuẩn hoá -> "de-thi"; trùng đường dẫn hệ thống (result, history, leaderboard, ref) -> thêm "-de".
--   3. Trùng nhau -> thêm hậu tố -2, -3... (bản ghi còn hoạt động được giữ slug gốc).
ALTER TABLE assessment.tests ADD COLUMN slug character varying(120);

WITH normalized AS (
    SELECT test_id,
           deleted_at,
           left(COALESCE(
               NULLIF(trim(BOTH '-' FROM regexp_replace(
                   lower(translate(normalize(title, NFC),
                       'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
                       'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD')),
                   '[^a-z0-9]+', '-', 'g')), ''),
               'de-thi'
           ), 100) AS base_slug
    FROM assessment.tests
),
base AS (
    SELECT test_id,
           deleted_at,
           CASE WHEN trim(BOTH '-' FROM base_slug) IN ('result', 'history', 'leaderboard', 'ref')
                THEN trim(BOTH '-' FROM base_slug) || '-de'
                ELSE trim(BOTH '-' FROM base_slug)
           END AS raw_slug
    FROM normalized
),
ranked AS (
    SELECT test_id,
           raw_slug,
           row_number() OVER (PARTITION BY raw_slug ORDER BY (deleted_at IS NOT NULL), test_id) AS rn
    FROM base
)
UPDATE assessment.tests t
SET slug = CASE WHEN r.rn = 1 THEN r.raw_slug ELSE r.raw_slug || '-' || r.rn END
FROM ranked r
WHERE t.test_id = r.test_id;

ALTER TABLE assessment.tests ALTER COLUMN slug SET NOT NULL;

-- Chỉ ràng buộc duy nhất giữa các đề chưa xoá mềm để slug của đề đã xoá được dùng lại.
CREATE UNIQUE INDEX uq_tests_slug ON assessment.tests (slug) WHERE deleted_at IS NULL;
