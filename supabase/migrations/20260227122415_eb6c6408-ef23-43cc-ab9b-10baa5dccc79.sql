
-- Add subtema column
ALTER TABLE public."METODOLOGIAS_GERADAS" ADD COLUMN subtema TEXT;

-- Update check constraint to include mapamental
ALTER TABLE public."METODOLOGIAS_GERADAS" DROP CONSTRAINT "METODOLOGIAS_GERADAS_metodo_check";
ALTER TABLE public."METODOLOGIAS_GERADAS" ADD CONSTRAINT "METODOLOGIAS_GERADAS_metodo_check" CHECK (metodo = ANY (ARRAY['cornell'::text, 'feynman'::text, 'mapamental'::text]));

-- Add unique constraint for area+tema+subtema+metodo
CREATE UNIQUE INDEX idx_metodologias_unique ON public."METODOLOGIAS_GERADAS" (area, tema, COALESCE(subtema, ''), metodo);
