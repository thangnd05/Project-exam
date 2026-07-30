

ALTER TABLE public.page_visits ADD COLUMN country_code character varying(2);
ALTER TABLE public.page_visits ADD COLUMN country character varying(100);
