-- Thêm thông tin quốc gia (geo-IP) cho lượt truy cập  phục vụ panel "Vị trí truy cập".
-- Suy từ IP lúc ghi nhận; IP nội bộ/localhost -> 'Local'; không tra được -> để null.
ALTER TABLE public.page_visits ADD COLUMN country_code character varying(2);
ALTER TABLE public.page_visits ADD COLUMN country character varying(100);
