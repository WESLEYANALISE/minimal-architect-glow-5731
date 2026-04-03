
CREATE TABLE public."METODOLOGIAS_GERADAS" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('cornell', 'feynman')),
  conteudo JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_metodologias_area_tema_metodo ON public."METODOLOGIAS_GERADAS" (area, tema, metodo);

ALTER TABLE public."METODOLOGIAS_GERADAS" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public."METODOLOGIAS_GERADAS" FOR SELECT USING (true);
CREATE POLICY "Allow service insert" ON public."METODOLOGIAS_GERADAS" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update" ON public."METODOLOGIAS_GERADAS" FOR UPDATE USING (true);
CREATE POLICY "Allow service delete" ON public."METODOLOGIAS_GERADAS" FOR DELETE USING (true);
