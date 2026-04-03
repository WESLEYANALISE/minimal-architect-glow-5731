-- Reset all generated content for Teoria Geral do Direito Privado I (disciplina_id = 1)
-- so it can be regenerated in the correct slides format
UPDATE faculdade_topicos 
SET 
  conteudo_gerado = NULL,
  status = 'pendente',
  flashcards = NULL,
  questoes = NULL,
  exemplos = NULL,
  termos = NULL,
  capa_url = NULL,
  url_narracao = NULL
WHERE disciplina_id = 1;