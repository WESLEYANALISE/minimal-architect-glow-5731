
-- Normalizar "Número do Artigo" na tabela LEI 8112: adicionar ordinal º para artigos 1-9
UPDATE "LEI 8112 - SERVIDOR PUBLICO"
SET "Número do Artigo" = "Número do Artigo" || 'º'
WHERE "Número do Artigo" IN ('1','2','3','4','5','6','7','8','9');

-- Normalizar caso tenha "Art." prefixo (remover)
UPDATE "LEI 8112 - SERVIDOR PUBLICO"
SET "Número do Artigo" = REGEXP_REPLACE("Número do Artigo", '^Art\.?\s*', '')
WHERE "Número do Artigo" LIKE 'Art.%' OR "Número do Artigo" LIKE 'Art %';

-- Normalizar ° (degree) → º (ordinal) em qualquer tabela de lei
UPDATE "LEI 8112 - SERVIDOR PUBLICO"
SET "Número do Artigo" = REPLACE("Número do Artigo", '°', 'º')
WHERE "Número do Artigo" LIKE '%°%';
