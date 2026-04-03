-- Shift all IDs by +10000 first to avoid PK conflicts, then shift back to +1
UPDATE "CF - Constituição Federal" SET id = id + 10000, ordem_artigo = COALESCE(ordem_artigo, id) + 10000;
UPDATE "CF - Constituição Federal" SET id = id - 9999, ordem_artigo = ordem_artigo - 9999;