ALTER TABLE public.simulados_concursos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT NULL;

-- Set known states
UPDATE simulados_concursos SET estado = 'Piauí' WHERE cargo = 'Delegado de Polícia';
UPDATE simulados_concursos SET estado = 'São Paulo' WHERE cargo = 'Escrevente Técnico Judiciário';
UPDATE simulados_concursos SET estado = 'Rio de Janeiro' WHERE cargo ILIKE '%Juiz%';
UPDATE simulados_concursos SET estado = 'Nacional' WHERE cargo = 'Agente de Polícia Federal';