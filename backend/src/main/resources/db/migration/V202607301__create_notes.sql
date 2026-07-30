-- Sổ tay ghi chú cá nhân: user tự viết/sửa/xoá, không gắn với câu hỏi hay bài thi
-- nào nên dùng được cho mọi loại đề (TOEIC, AWS...).
CREATE TABLE notes (
    note_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    title character varying(200) NOT NULL,
    content text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT notes_pkey PRIMARY KEY (note_id)
);

-- Truy vấn duy nhất hiện có: lấy ghi chú của một user, mới sửa xếp trước.
CREATE INDEX idx_notes_user_id ON notes USING btree (user_id);
