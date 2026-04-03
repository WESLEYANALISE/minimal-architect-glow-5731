ALTER TABLE geracao_unificada_fila DROP CONSTRAINT geracao_unificada_fila_tipo_check;
ALTER TABLE geracao_unificada_fila ADD CONSTRAINT geracao_unificada_fila_tipo_check 
  CHECK (tipo = ANY (ARRAY['cornell'::text, 'feynman'::text, 'flashcards'::text, 'questoes'::text, 'lacunas'::text]));