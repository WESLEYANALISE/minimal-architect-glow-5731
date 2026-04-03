
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pais_cadastro TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado_cadastro TEXT;
