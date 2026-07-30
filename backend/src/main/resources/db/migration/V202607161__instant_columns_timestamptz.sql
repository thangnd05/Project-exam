-- ============================================================================
-- Đổi các cột map với java.time.Instant sang timestamptz cho khớp Hibernate 6
-- (TIMESTAMP_UTC). Trước đây Hibernate tạo 2 cột này là `timestamp` (không tz)
-- do columnDefinition cũ trong entity; ddl-auto=update nuốt lỗi lệch kiểu này.
--
-- Wall-time đang lưu là GIỜ VN (đã xác minh thực nghiệm qua pgjdbc: JVM tz
-- Asia/Ho_Chi_Minh -> session TimeZone VN -> timestamptz bị cast về wall VN
-- khi ghi vào cột timestamp). Vì vậy convert bằng AT TIME ZONE 'Asia/Ho_Chi_Minh'
-- để giữ nguyên thời điểm thật; VN không có DST nên an toàn tuyệt đối.
-- ============================================================================

ALTER TABLE questions
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE recovery_resources
    ALTER COLUMN created_at TYPE timestamptz
        USING created_at AT TIME ZONE 'Asia/Ho_Chi_Minh';
