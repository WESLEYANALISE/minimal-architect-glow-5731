
ALTER TABLE public.categorias_progresso 
ADD COLUMN IF NOT EXISTS pagina_leitura integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_paginas integer DEFAULT 0;
