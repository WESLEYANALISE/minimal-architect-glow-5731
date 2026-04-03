
-- Fase 1: Limpar registros-lixo da Lei da Tortura (manter apenas arts 1º-4º)
DELETE FROM "Lei 9.455 de 1997 - Tortura"
WHERE id IN (1, 2, 7, 8, 9);

-- Fase 2: Dropar tabela duplicada da Lei 9.099
DROP TABLE IF EXISTS "LEI 9099 - JUIZADOS CIVEIS";

-- Fase 4: Preencher ultima_atualizacao nas tabelas com NULL
UPDATE "LEI 12846 - ANTICORRUPCAO" SET ultima_atualizacao = now() WHERE ultima_atualizacao IS NULL;
UPDATE "LEI 13140 - MEDIACAO" SET ultima_atualizacao = now() WHERE ultima_atualizacao IS NULL;
UPDATE "LEI 4717 - ACAO POPULAR" SET ultima_atualizacao = now() WHERE ultima_atualizacao IS NULL;
UPDATE "LEI 6015 - REGISTROS PUBLICOS" SET ultima_atualizacao = now() WHERE ultima_atualizacao IS NULL;
UPDATE "LEI 7347 - ACAO CIVIL PUBLICA" SET ultima_atualizacao = now() WHERE ultima_atualizacao IS NULL;
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" SET ultima_atualizacao = now() WHERE ultima_atualizacao IS NULL;
