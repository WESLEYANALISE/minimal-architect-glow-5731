
-- Add subtema column to support per-subtema mapa mental generation
ALTER TABLE public."MAPAS_MENTAIS_GERADOS" ADD COLUMN subtema text;

-- Drop old unique constraint (area, tema)
ALTER TABLE public."MAPAS_MENTAIS_GERADOS" DROP CONSTRAINT "MAPAS_MENTAIS_GERADOS_area_tema_key";

-- Create new unique constraint (area, tema, subtema)
CREATE UNIQUE INDEX "MAPAS_MENTAIS_GERADOS_area_tema_subtema_key" ON public."MAPAS_MENTAIS_GERADOS" (area, tema, subtema);
