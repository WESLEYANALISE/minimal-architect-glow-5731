
ALTER TABLE public.evelyn_usuarios 
ADD COLUMN IF NOT EXISTS tempo_teste_minutos INTEGER DEFAULT 4320,
ADD COLUMN IF NOT EXISTS teste_inicio TIMESTAMPTZ;

-- Set teste_inicio from data_primeiro_contato for existing users
UPDATE public.evelyn_usuarios 
SET teste_inicio = data_primeiro_contato 
WHERE teste_inicio IS NULL AND data_primeiro_contato IS NOT NULL;

COMMENT ON COLUMN public.evelyn_usuarios.tempo_teste_minutos IS 'Tempo de teste em minutos (default 4320 = 3 dias)';
COMMENT ON COLUMN public.evelyn_usuarios.teste_inicio IS 'Quando o período de teste começou';
