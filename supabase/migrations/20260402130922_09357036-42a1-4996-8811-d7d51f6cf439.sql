
-- Dropar tabelas-fantasma vazias
DROP TABLE IF EXISTS "LC 135 - Ficha Limpa";
DROP TABLE IF EXISTS "LEI 9605 - Crimes Ambientais";
DROP TABLE IF EXISTS "LEI 11101 - Recuperação e Falência";
DROP TABLE IF EXISTS "LEI 13104 - Feminicídio";
DROP TABLE IF EXISTS "LEI 13260 - Antiterrorismo";
DROP TABLE IF EXISTS "LEI 7492 - Crimes Sistema Financeiro";
DROP TABLE IF EXISTS "LEI 8137 - Crimes Ordem Tributária";
DROP TABLE IF EXISTS "LEI 1079 - Crimes Responsabilidade";
DROP TABLE IF EXISTS "LEI 5015 - Crimes Transnacionais";
DROP TABLE IF EXISTS "LEI 12016 - Mandado de Segurança";
DROP TABLE IF EXISTS "LEI 12965 - Marco Civil Internet";
DROP TABLE IF EXISTS "LEI 8245 - Inquilinato";
DROP TABLE IF EXISTS "LEI 3365 - Desapropriação";
DROP TABLE IF EXISTS "LEI 6938 - Meio Ambiente";
DROP TABLE IF EXISTS "LEI 9307 - Arbitragem";
DROP TABLE IF EXISTS "LEI 9507 - Habeas Data";
DROP TABLE IF EXISTS "LEI 10520 - Pregão";
DROP TABLE IF EXISTS "DECRETOS_VADEMECUM";

-- Deduplicar Lei de Tortura
DELETE FROM "Lei 9.455 de 1997 - Tortura" a
USING "Lei 9.455 de 1997 - Tortura" b
WHERE a.id > b.id AND a."Artigo" = b."Artigo";
