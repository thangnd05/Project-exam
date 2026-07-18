-- Bảng ghi nhận lượt xem trang (page view) phục vụ thống kê traffic Dashboard/Analytics.
-- FE ping mỗi lần vào/chuyển route -> 1 dòng. sessionKey tái dùng guestSessionId (localStorage).
CREATE TABLE public.page_visits (
    visit_id      character varying(255) NOT NULL,
    path          character varying(255) NOT NULL,
    session_key   character varying(64),
    user_id       character varying(255),
    ip_address    character varying(45),
    created_at    timestamp(6) without time zone NOT NULL,
    CONSTRAINT page_visits_pkey PRIMARY KEY (visit_id)
);

CREATE INDEX idx_page_visits_created_at ON public.page_visits (created_at);
CREATE INDEX idx_page_visits_session_key ON public.page_visits (session_key);
