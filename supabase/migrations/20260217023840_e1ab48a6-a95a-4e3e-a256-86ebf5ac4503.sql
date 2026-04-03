
CREATE TABLE public.batalha_juridica_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  casos JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_batalha_cache_area_tema ON public.batalha_juridica_cache (area, tema);

ALTER TABLE public.batalha_juridica_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Batalha cache is readable by everyone"
ON public.batalha_juridica_cache
FOR SELECT
USING (true);

CREATE POLICY "Batalha cache insertable by authenticated"
ON public.batalha_juridica_cache
FOR INSERT
WITH CHECK (true);
