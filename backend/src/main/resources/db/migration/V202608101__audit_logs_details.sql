-- Nhật ký hiện chỉ ghi "ai gọi endpoint nào". Với thao tác nhạy cảm (đổi quyền của vai trò)
-- thì thứ cần biết là NỘI DUNG thay đổi, nên thêm một cột mô tả tự do.
ALTER TABLE audit_logs
    ADD COLUMN details TEXT;
