
-- Criar tabela de favoritos do JuriFlix
CREATE TABLE public.juriflix_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  juriflix_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, juriflix_id)
);

-- Enable RLS
ALTER TABLE public.juriflix_favoritos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own favorites"
ON public.juriflix_favoritos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
ON public.juriflix_favoritos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.juriflix_favoritos FOR DELETE
USING (auth.uid() = user_id);

-- Fix logo_path corrompidos no JURIFLIX (dados existentes com path relativo)
UPDATE "JURIFLIX"
SET onde_assistir = jsonb_set(
  jsonb_set(
    jsonb_set(
      onde_assistir::jsonb,
      '{flatrate}',
      COALESCE(
        (SELECT jsonb_agg(
          CASE 
            WHEN elem->>'logo_path' IS NOT NULL 
              AND (elem->>'logo_path') LIKE '/%' 
              AND (elem->>'logo_path') NOT LIKE 'http%'
            THEN jsonb_set(elem, '{logo_path}', to_jsonb('https://image.tmdb.org/t/p/original' || (elem->>'logo_path')))
            ELSE elem
          END
        ) FROM jsonb_array_elements(onde_assistir::jsonb->'flatrate') AS elem),
        onde_assistir::jsonb->'flatrate'
      )
    ),
    '{rent}',
    COALESCE(
      (SELECT jsonb_agg(
        CASE 
          WHEN elem->>'logo_path' IS NOT NULL 
            AND (elem->>'logo_path') LIKE '/%' 
            AND (elem->>'logo_path') NOT LIKE 'http%'
          THEN jsonb_set(elem, '{logo_path}', to_jsonb('https://image.tmdb.org/t/p/original' || (elem->>'logo_path')))
          ELSE elem
        END
      ) FROM jsonb_array_elements(onde_assistir::jsonb->'rent') AS elem),
      onde_assistir::jsonb->'rent'
    )
  ),
  '{buy}',
  COALESCE(
    (SELECT jsonb_agg(
      CASE 
        WHEN elem->>'logo_path' IS NOT NULL 
          AND (elem->>'logo_path') LIKE '/%' 
          AND (elem->>'logo_path') NOT LIKE 'http%'
        THEN jsonb_set(elem, '{logo_path}', to_jsonb('https://image.tmdb.org/t/p/original' || (elem->>'logo_path')))
        ELSE elem
      END
    ) FROM jsonb_array_elements(onde_assistir::jsonb->'buy') AS elem),
    onde_assistir::jsonb->'buy'
  )
)
WHERE onde_assistir IS NOT NULL
  AND onde_assistir::text LIKE '%"logo_path":"/%';
