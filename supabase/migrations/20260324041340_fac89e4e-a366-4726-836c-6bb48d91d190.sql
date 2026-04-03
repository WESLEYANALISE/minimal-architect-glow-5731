ALTER TABLE faculdade_progresso 
  ADD COLUMN IF NOT EXISTS leitura_concluida boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pagina_leitura integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paginas integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flashcards_concluidos boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS questoes_concluidas boolean DEFAULT false;