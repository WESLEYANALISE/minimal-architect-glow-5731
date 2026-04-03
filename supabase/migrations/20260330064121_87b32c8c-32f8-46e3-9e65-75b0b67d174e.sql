-- Migration 2: Add 13 missing columns to Group 3 (minimal) tables
-- These tables only have: id, "Número do Artigo", Artigo, explicacao_tecnico, "Narração", ordem_artigo, created_at/ultima_atualizacao
-- Need to add: Comentario, Aula, versao_conteudo, termos, flashcards, questoes, 
--   explicacao_resumido, explicacao_simples_menor16, explicacao_simples_maior16, exemplo,
--   termos_aprofundados, visualizacoes, ultima_visualizacao

DO $$
DECLARE
  tbl TEXT;
  tabelas TEXT[] := ARRAY[
    'DECRETO 1171 - ETICA SERVIDOR',
    'DL 3688 - CONTRAVENCOES PENAIS',
    'LC 75 - MINISTERIO PUBLICO UNIAO',
    'LC 80 - DEFENSORIA PUBLICA',
    'LC 135 - FICHA LIMPA',
    'LEI 10520 - PREGAO',
    'LEI 1079 - CRIMES RESPONSABILIDADE',
    'LEI 11079 - PPP',
    'LEI 11101 - RECUPERACAO FALENCIA',
    'LEI 12016 - MANDADO DE SEGURANCA',
    'LEI 12037 - IDENTIFICACAO CRIMINAL',
    'LEI 12965 - MARCO CIVIL INTERNET',
    'LEI 13104 - FEMINICIDIO',
    'LEI 13260 - ANTITERRORISMO',
    'LEI 3365 - DESAPROPRIACAO',
    'LEI 5015 - CRIMES TRANSNACIONAIS',
    'LEI 6404 - SOCIEDADES ANONIMAS',
    'LEI 6938 - MEIO AMBIENTE',
    'LEI 7492 - CRIMES SISTEMA FINANCEIRO',
    'LEI 7960 - PRISAO TEMPORARIA',
    'LEI 8112 - SERVIDOR PUBLICO',
    'LEI 8137 - CRIMES ORDEM TRIBUTARIA',
    'LEI 8245 - INQUILINATO',
    'LEI 8987 - CONCESSOES',
    'LEI 9307 - ARBITRAGEM',
    'LEI 9507 - HABEAS DATA',
    'LEI 9605 - CRIMES AMBIENTAIS'
  ];
BEGIN
  FOREACH tbl IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "Comentario" text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "Aula" text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS termos jsonb', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS flashcards jsonb', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS questoes jsonb', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS explicacao_resumido text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS exemplo text', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS termos_aprofundados jsonb DEFAULT ''{}''::jsonb', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0', tbl);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamptz', tbl);
  END LOOP;
END $$;

-- Rename created_at to ultima_atualizacao where needed
ALTER TABLE "DECRETO 1171 - ETICA SERVIDOR" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "DL 3688 - CONTRAVENCOES PENAIS" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "LC 75 - MINISTERIO PUBLICO UNIAO" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "LC 80 - DEFENSORIA PUBLICA" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "LEI 11079 - PPP" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "LEI 12037 - IDENTIFICACAO CRIMINAL" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "LEI 6404 - SOCIEDADES ANONIMAS" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "LEI 7960 - PRISAO TEMPORARIA" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "LEI 8112 - SERVIDOR PUBLICO" RENAME COLUMN created_at TO ultima_atualizacao;
ALTER TABLE "LEI 8987 - CONCESSOES" RENAME COLUMN created_at TO ultima_atualizacao;