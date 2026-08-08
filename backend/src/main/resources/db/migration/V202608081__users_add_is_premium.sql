-- Thêm cột is_premium cho bảng users: user premium hiển thị màu vàng kim loại thay cho màu xanh mặc định
ALTER TABLE public.users ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
