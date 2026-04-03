
-- Drop the expression-based unique index
DROP INDEX IF EXISTS idx_metodologias_unique;

-- Create a proper unique constraint on the raw columns
ALTER TABLE public."METODOLOGIAS_GERADAS" 
ADD CONSTRAINT metodologias_geradas_area_tema_subtema_metodo_key 
UNIQUE (area, tema, subtema, metodo);
